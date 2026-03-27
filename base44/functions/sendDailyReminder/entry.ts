import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This endpoint is called by a scheduled automation — verify via service role
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({
      reminder_email_enabled: true,
    });

    if (!profiles || profiles.length === 0) {
      return Response.json({ sent: 0, message: 'No users opted in' });
    }

    // Get all users to map emails
    const users = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    users.forEach(u => { userMap[u.email] = u; });

    const today = new Date().toISOString().split('T')[0];
    let sent = 0;
    let skipped = 0;

    for (const profile of profiles) {
      // Skip users who already completed today's micro-moment
      if (profile.last_micro_date === today) {
        skipped++;
        continue;
      }

      const email = profile.user_id;
      const name = profile.display_name || 'there';
      const streak = profile.micro_streak || 0;

      const streakLine = streak > 1
        ? `You're on a ${streak}-day streak 🔥 — don't break it.`
        : streak === 1
        ? `You started your streak yesterday 🔥 Keep it going.`
        : `Start your streak today — it takes 30 seconds.`;

      const subject = streak > 0
        ? `🔥 ${streak} days strong — your daily check-in is ready`
        : `⚡ Your 30-second empathy check-in`;

      const body = `Hi ${name},

Today's Micro-Moment is waiting for you.

${streakLine}

One quick scenario. One honest response. One small insight — delivered instantly.

👉 Open your daily check-in: https://app.base44.com

It takes 30 seconds.

— The Empathy Enigma team

---
You're receiving this because you opted into daily reminders. 
To stop, open the app and toggle off "Daily email reminder" on the Micro-Moment page.`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body,
        from_name: 'The Empathy Enigma',
      });

      sent++;
    }

    console.log(`Daily reminder: sent=${sent}, skipped=${skipped}`);
    return Response.json({ sent, skipped });
  } catch (error) {
    console.error('sendDailyReminder error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});