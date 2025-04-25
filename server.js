const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8002;

const HUBSPOT_TOKEN = 'added token';

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


app.post('/submit', async (req, res) => {
  const { name, last, contact, password, email } = req.body;

  try {
    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        properties: {
          firstname: name,
          lastname: last,
          email: email,
          phone: contact,
          password: password
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ success: true, message: 'Contact created successfully.' });

  } catch (error) {
    const errRes = error.response;
    const errData = errRes?.data;
    const errMessage = (errData?.message || '').toLowerCase();

    if (errRes && (errRes.status === 409 || errMessage.includes('duplicate') || errMessage.includes('already exists') || errData?.category === 'CONFLICT')) {
      return res.status(409).json({ success: false, message: 'Duplicate details' });
    }

    console.error('HubSpot error:', errData || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/contacts', async (req, res) => {
  try {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`
      },
      params: {
        properties: 'firstname,lastname,email,phone',
        limit: 100
      }
    });

    const contacts = response.data.results.map(contact => ({
      id: contact.id,
      firstname: contact.properties.firstname,
      lastname: contact.properties.lastname,
      email: contact.properties.email,
      phone: contact.properties.phone
    }));

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error.message);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});


app.get('/contact/:id', async (req, res) => {
  const contactId = req.params.id;

  try {
    await axios.delete(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`
      }
    });

    res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error) {
    console.error('Error deleting contact:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
