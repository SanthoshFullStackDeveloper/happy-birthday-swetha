// src/pages/api/notify.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Missing title or message in request body' });
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
               Authorization: `Basic os_v2_app_7tpn2syuf5ggtgooesihkzsiz4hfve3hyz6ee4nal6nuxgnbpujc2djlnrj65y7xekubxpluwcawarqqcgnprkw2swtmyvdtjnmwxmi`,
      },
      body: JSON.stringify({
        app_id: 'fcdedd4b-142f-4c69-99ce-2490756648cf',
        included_segments: ['Subscribed Users'],
        headings: { en: title },
        contents: { en: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to send notification', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong', details: err });
  }
}
