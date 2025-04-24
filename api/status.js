// Alternative status check endpoint
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'online',
    version: '1.0.0',
    time: new Date().toISOString()
  });
}