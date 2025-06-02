import fetch from 'node-fetch';

const token = 'EAAQ96GMlcWsBOygXXZBh38jZBeftbrHm105WeRlOKQup3bArdaTYmdJlMuiQp015TiZAyMLb5ZB93IERpGICAETT3z5nZBM5PRe0kUpJn85XGZCzEudf0ih02lJhUesqvEulpf6rsvDCurycw5EWSyLXpnmMWh446WyxayUk3kRE2ZBZBLWZAFRI73ajvIPtGZAgrpLQXCKwukXm4Gi520vQQBwoZBm2PuoyO2wZBLkZD';

const phone_number_id = '662379330289046'; // اللي انت كتبته
const recipient_number = '966550379037'; // لازم يكون رقمك المسجل بالاختبار بدون +
const url = `https://graph.facebook.com/v18.0/${phone_number_id}/messages`;

const body = {
  messaging_product: 'whatsapp',
  to: recipient_number,
  type: 'text',
  text: {
    body: 'أهلا بك! أول رسالة تجريبية من سُديم 🎯'
  }
};

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})
.then(response => response.json())
.then(data => console.log('✅ رسالة أُرسلت:', data))
.catch(error => console.error('❌ خطأ:', error));
