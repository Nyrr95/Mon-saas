
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://ptdogghbtxwxsclxzuui.supabase.co',
  'sb_publishable_UiLYUyVXpX05zF48O-1HNg_NzxP1xAS'
);

const app = document.getElementById('app');

app.innerHTML = `
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f4f7fc;color:#172544}
header{background:#172b55;color:white;text-align:center;padding:32px 16px}
main{max-width:960px;margin:auto;padding:28px 16px;text-align:center}
.plans{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}
.plan,.panel{background:white;padding:24px;border-radius:15px;box-shadow:0 4px 15px #17254415}
.plan{width:240px}
.price{font-size:32px;font-weight:bold}
button{background:#2563eb;color:white;border:0;border-radius:8px;padding:12px 18px;cursor:pointer;margin:5px}
button:disabled{opacity:.6}
input{width:100%;max-width:360px;display:block;margin:12px auto;padding:12px;border:1px solid #ccd3e0;border-radius:8px;font:inherit}
.panel{max-width:480px;margin:30px auto}
#message{min-height:22px}
footer{text-align:center;padding:28px;color:#667085}
[hidden]{display:none!important}
</style>
<header>
<h1>RelancePro</h1>
<p>La gestion des relances de factures, simplifiée.</p>
</header>
<main>
<section>
<h2>Gagnez du temps sur vos impayés</h2>
<p>Découvrez nos offres.</p>
<div class="plans">
${[['Basic',29],['Pro',49],['Premium',79]].map(([name,price])=>`
<div class="plan">
<h2>${name}</h2>
<p class="price">${price} €</p>
<p>par mois</p>
<button disabled>Bientôt disponible</button>
</div>`).join('')}
</div>
</section>
<section class="panel" id="auth">
<h2>Créer un compte ou se connecter</h2>
<form id="auth-form">
<input id="email" type="email" placeholder="Adresse email" autocomplete="email" required>
<input id="password" type="password" placeholder="Mot de passe (6 caractères minimum)" minlength="6" required>
<button id="signup" type="button">Créer mon compte</button>
<button id="signin" type="submit">Me connecter</button>
</form>
<p id="message" role="status"></p>
</section>
<section class="panel" id="account" hidden>
<h2>Mon espace client</h2>
<p>Connecté avec : <strong id="account-email"></strong></p>
<p>La gestion des factures arrive bientôt.</p>
<button id="signout">Me déconnecter</button>
</section>
</main>
<footer>© RelancePro</footer>
`;

const $ = id => document.getElementById(id);
const message = (text) => { $('message').textContent = text; };

function showSession(session) {
  const connected = !!session?.user;
  $('auth').hidden = connected;
  $('account').hidden = !connected;
  $('account-email').textContent = connected ? session.user.email : '';
}

$('signup').onclick = async () => {
  if (!$('auth-form').reportValidity()) return;
  message('Création du compte...');
  const {data,error} = await supabase.auth.signUp({
    email:$('email').value.trim(),
    password:$('password').value
  });
  if(error) return message(error.message);
  if(data.session) showSession(data.session);
  else message('Vérifie tes emails pour confirmer ton compte.');
};

$('auth-form').onsubmit = async (event) => {
  event.preventDefault();
  message('Connexion...');
  const {data,error} = await supabase.auth.signInWithPassword({
    email:$('email').value.trim(),
    password:$('password').value
  });
  if(error) return message(error.message);
  showSession(data.session);
};

$('signout').onclick = async () => {
  const {error} = await supabase.auth.signOut();
  if(error) return alert(error.message);
  showSession(null);
  message('Déconnecté.');
};

supabase.auth.onAuthStateChange((_event,session) => {
  showSession(session);
});

supabase.auth.getSession().then(({data,error}) => {
  if(error) message(error.message);
  else showSession(data.session);
});
