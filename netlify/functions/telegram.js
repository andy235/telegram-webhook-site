exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Get environment variables
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Check if credentials exist
    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('Missing credentials:', { 
        hasToken: !!BOT_TOKEN, 
        hasChatId: !!CHAT_ID 
      });
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing Telegram credentials' 
        })
      };
    }

    // Parse request body
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON data' 
        })
      };
    }

    // Check required fields
    const requiredFields = ['fuel-type', 'volume', 'address', 'date', 'time', 'company', 'phone'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing fields:', missingFields);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: ' + missingFields.join(', ')
        })
      };
    }

    // Format fuel type
    const formatFuelType = (type) => {
      const types = {
        'summer': 'ДТ летнее',
        'winter': 'ДТ зимнее',
        'arctic': 'ДТ арктическое',
        'inter': 'ДТ межсезонное'
      };
      return types[type] || type;
    };

    // Format date
    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('ru-RU');
      } catch (error) {
        return dateString;
      }
    };

    // Format volume
    const formatVolume = (volume) => {
      try {
        return Number(volume).toLocaleString('ru-RU');
      } catch (error) {
        return volume;
      }
    };

    // Create message
    const message = `🚛 <b>НОВАЯ ЗАЯВКА НА ДОСТАВКУ ДИЗТОПЛИВА</b>

📋 <b>Тип топлива:</b> ${formatFuelType(data['fuel-type'])}
⛽ <b>Объем:</b> ${formatVolume(data.volume)} л
📍 <b>Адрес:</b> ${data.address}
📅 <b>Дата:</b> ${formatDate(data.date)}
🕐 <b>Время:</b> ${data.time}
🏢 <b>Компания:</b> ${data.company}
📞 <b>Телефон:</b> ${data.phone}${data.comment ? `\n💭 <b>Комментарий:</b> ${data.comment}` : ''}

⏰ <i>Заявка получена: ${new Date().toLocaleString('ru-RU')}</i>`;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const telegramData = await telegramResponse.json();

    if (telegramData.ok) {
      console.log('Message sent successfully');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Заявка успешно отправлена!' 
        })
      };
    } else {
      console.error('Telegram API Error:', telegramData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Ошибка отправки в Telegram: ' + (telegramData.description || 'Unknown error')
        })
      };
    }

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Внутренняя ошибка сервера: ' + error.message 
      })
    };
  }
};
