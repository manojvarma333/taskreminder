import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  is_completed: boolean;
  is_notified: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 8);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .eq('is_notified', false)
      .eq('scheduled_date', currentDate)
      .lte('scheduled_time', currentTime);

    if (error) throw error;

    const dueTasks: Task[] = tasks || [];
    const notifiedTasks: string[] = [];

    for (const task of dueTasks) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ is_notified: true })
        .eq('id', task.id);

      if (!updateError) {
        notifiedTasks.push(task.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${dueTasks.length} due tasks`,
        notified: notifiedTasks.length,
        tasks: dueTasks.map(t => ({
          id: t.id,
          title: t.title,
          scheduled_time: t.scheduled_time,
        })),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
