import { google } from 'googleapis';

export const createGoogleCalendarEvent = async (sessionData, agentDetails) => {
  // Initialize the Google Calendar API client
  const calendar = google.calendar({ version: 'v3', auth: YOUR_API_KEY });

  const event = {
    summary: `1:1 Coaching - ${agentDetails.firstName} ${agentDetails.lastName}`,
    description: `
      Focus Area: ${sessionData.development.focusArea}
      
      Action Plan: ${sessionData.development.actionPlan}
      
      Success Metrics: ${sessionData.development.successMetrics}
    `.trim(),
    start: {
      dateTime: sessionData.development.nextSessionDate,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: new Date(new Date(sessionData.development.nextSessionDate).getTime() + 60 * 60 * 1000),
      timeZone: 'America/New_York',
    },
    attendees: [
      { email: agentDetails.email },
      { email: sessionData.managerEmail }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 }
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}; 