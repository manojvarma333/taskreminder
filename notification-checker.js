setInterval(async () => {
  try {
    const response = await fetch('http://localhost:3001/check-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    console.log('Notification check result:', result);
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}, 30000); // Check every 30 seconds

console.log('Notification checker started...');
