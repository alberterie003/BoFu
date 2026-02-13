import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        const from = formData.get('From') as string // Lead's WhatsApp number
        const to = formData.get('To') as string     // Twilio number (client's)
        const body = formData.get('Body') as string // Message text

        console.log('Incoming WhatsApp message:', { from, to, body })

        const supabase = createAdminClient() as any

        // 1. IDENTIFY CLIENT by destination Twilio number
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('twilio_phone_number', to.replace('whatsapp:', ''))
            .single()

        if (clientError || !client) {
            console.error('Client not found for number:', to)
            return sendTwimlResponse('Error: This number is not configured.')
        }

        // 2. CHECK FOR EXISTING SESSION
        const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('lead_phone', from.replace('whatsapp:', ''))
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        // 3. DECIDE: Bot funnel vs Forward to client
        if (session && session.status === 'forwarding') {
            // Session completed - forward all messages to client
            await forwardToClient(client, from, body)
            return new NextResponse('', { status: 200 })
        }

        // 4. PROCESS FUNNEL MESSAGE
        const responseMessage = await processFunnelMessage(client, from, body, session)
        return sendTwimlResponse(responseMessage)

    } catch (error) {
        console.error('Webhook error:', error)
        return sendTwimlResponse('Sorry, there was an error processing your message.')
    }
}

// Process message in funnel context
async function processFunnelMessage(
    client: any,
    leadPhone: string,
    message: string,
    session: any
) {
    const supabase = createAdminClient() as any
    const cleanPhone = leadPhone.replace('whatsapp:', '')

    // FIRST MESSAGE - Parse funnel ID
    if (!session && message.toUpperCase().startsWith('START_FUNNEL_')) {
        const funnelId = message.replace(/START_FUNNEL_/i, '').trim()

        console.log('Starting new funnel:', funnelId, 'for', cleanPhone)

        // Get funnel details via RPC (Bypasses table cache issues)
        const { data: funnelJson, error: funnelError } = await supabase
            .rpc('get_funnel_for_webhook', { p_funnel_id: funnelId })

        const funnel = funnelJson as any


        if (funnelError || !funnel) {
            console.error('Funnel Lookup Error:', funnelError)
            return 'Sorry, that funnel code is not valid. Please check and try again.'
        }

        if (!funnel.steps || funnel.steps.length === 0) {
            return 'This funnel has no questions configured yet.'
        }

        // Sort steps by order
        const sortedSteps = funnel.steps.sort((a: any, b: any) => a.order - b.order)

        // Create new session
        await supabase
            .from('whatsapp_sessions')
            .insert({
                client_id: client.id,
                lead_phone: cleanPhone,
                funnel_id: funnelId,
                current_step: 0,
                status: 'active'
            })

        const firstStep = sortedSteps[0]

        return `¡Hola! 👋 Soy el asistente de ${client.name}.

${funnel.welcome_message || 'Te haré algunas preguntas rápidas.'}

**Pregunta 1/${sortedSteps.length}:** ${firstStep.question}`
    }

    // CONTINUING FUNNEL - Process response
    if (session && session.status === 'active') {
        const { data: funnel } = await supabase
            .from('funnels')
            .select(`
        *,
        steps:funnel_steps(*)
      `)
            .eq('id', session.funnel_id)
            .single()

        if (!funnel) {
            return 'Error loading funnel. Please try again.'
        }

        const sortedSteps = funnel.steps.sort((a: any, b: any) => a.order - b.order)
        const currentStep = sortedSteps[session.current_step]

        // Save response
        const updatedResponses = {
            ...session.responses,
            [currentStep.field_name]: message
        }

        const nextStepIndex = session.current_step + 1

        // CHECK IF FUNNEL COMPLETE
        if (nextStepIndex >= sortedSteps.length) {
            console.log('Funnel completed for', cleanPhone)

            // Update session to completed
            await supabase
                .from('whatsapp_sessions')
                .update({
                    status: 'forwarding',
                    responses: updatedResponses
                })
                .eq('id', session.id)

            // Create lead in database
            await createLead(client, cleanPhone, updatedResponses, funnel, session.id)

            // Notify client
            await notifyClient(client, cleanPhone, updatedResponses)

            return `¡Perfecto! ✅ 

Hemos registrado tu información. Un representante de ${client.name} se comunicará contigo pronto.

¿Tienes alguna pregunta adicional? Cualquier mensaje que envíes ahora será enviado directamente al equipo.`
        }

        // CONTINUE TO NEXT QUESTION
        await supabase
            .from('whatsapp_sessions')
            .update({
                current_step: nextStepIndex,
                responses: updatedResponses
            })
            .eq('id', session.id)

        const nextStep = sortedSteps[nextStepIndex]
        return `**Pregunta ${nextStepIndex + 1}/${sortedSteps.length}:** ${nextStep.question}`
    }

    // NO SESSION - Ask to start with code
    return `¡Hola! Para iniciar, por favor envía el código del funnel que recibiste.

Ejemplo: START_FUNNEL_ABC123`
}

// Forward message to client's real WhatsApp
async function forwardToClient(
    client: any,
    leadPhone: string,
    message: string
) {
    if (!client.client_whatsapp_number) {
        console.warn('Client has no WhatsApp number configured:', client.id)
        return
    }

    const cleanLeadPhone = leadPhone.replace('whatsapp:', '')

    try {
        await twilioClient.messages.create({
            from: `whatsapp:${client.twilio_phone_number}`,
            to: `whatsapp:${client.client_whatsapp_number}`,
            body: `💬 **Lead ${cleanLeadPhone}:**\n${message}`
        })
        console.log('Message forwarded to client:', client.client_whatsapp_number)
    } catch (error) {
        console.error('Error forwarding to client:', error)
    }
}

// Notify client of new lead
async function notifyClient(
    client: any,
    leadPhone: string,
    responses: any
) {
    if (!client.client_whatsapp_number) {
        return
    }

    const summary = Object.entries(responses)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n')

    try {
        await twilioClient.messages.create({
            from: `whatsapp:${client.twilio_phone_number}`,
            to: `whatsapp:${client.client_whatsapp_number}`,
            body: `🎉 **Nuevo Lead Capturado!**

📱 Teléfono: ${leadPhone}

📋 **Información:**
${summary}

El lead ahora puede escribirte directamente. Cualquier mensaje que envíe será reenviado a este número.`
        })
        console.log('Client notified of new lead')
    } catch (error) {
        console.error('Error notifying client:', error)
    }
}

// Create lead in database
async function createLead(
    client: any,
    phone: string,
    responses: any,
    funnel: any,
    sessionId: string
) {
    const supabase = createAdminClient() as any

    try {
        await supabase.from('leads').insert({
            client_id: client.id,
            funnel_id: funnel.id,
            source: 'whatsapp',
            whatsapp_number: phone,
            whatsapp_session_id: sessionId,
            contact_data: {
                phone,
                ...responses
            },
            temperature: 'warm',
            status: 'new'
        })
        console.log('Lead created in database')
    } catch (error) {
        console.error('Error creating lead:', error)
    }
}

// Send TwiML response
function sendTwimlResponse(message: string) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`

    return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' }
    })
}

// Escape XML special characters
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
