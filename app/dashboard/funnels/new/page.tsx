import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateFromTemplate from '@/components/funnels/CreateFromTemplate';

export default async function NewFunnelPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user's first client (or you can add client selection UI)
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .limit(1)
        .single();

    if (!clients) {
        return (
            <div className="container mx-auto py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                        You need to create a client first before creating funnels.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <CreateFromTemplate clientId={clients.id} />
        </div>
    );
}
