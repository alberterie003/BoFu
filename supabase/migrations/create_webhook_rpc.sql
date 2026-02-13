-- ============================================
-- RPC: Get Funnel for Webhook
-- ============================================

CREATE OR REPLACE FUNCTION get_funnel_for_webhook(p_funnel_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_funnel JSONB;
BEGIN

  SELECT 
    to_jsonb(f) || jsonb_build_object(
      'steps', (
        SELECT COALESCE(jsonb_agg(fs.* ORDER BY fs.order_index), '[]'::jsonb)
        FROM funnel_steps fs
        WHERE fs.funnel_id = f.id
      )
    )
  INTO v_funnel
  FROM funnels f
  WHERE f.id = p_funnel_id;

  RETURN v_funnel;

END;
$$;
