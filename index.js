import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, currentUser } from 'firebase/auth';
import { getDatabase, ref, set, push, get, child, update, orderByChild,equalTo, query } from 'firebase/database';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM elements
const whenSignedIn = document.getElementById('whenSignedIn');
const whenBanned = document.getElementById('whenBanned');
const whenSignedOut = document.getElementById('whenSignedOut');
const signInBtn = document.getElementById('signInBtn');
const logInBtn = document.getElementById('logInBtn');
const logOutBtnSignedIn = document.getElementById('logOutBtnSignedIn');
const logOutBtnBanned = document.getElementById('logOutBtnBanned');
const userDetails = document.getElementById('userDetails');
const bannedUsersButton = document.getElementById('bannedUsersButton');
const banUserButton = document.getElementById('banUserButton');
const postar = document.getElementById('postar');
const adminStuff = document.getElementById('adminStuff');
const postMessage = document.getElementById('postMessage');
const banList = document.getElementById('BanList');


// Sign In function
function signIn() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const authMessage = document.getElementById("authMessage");
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            writeUserData(user.uid, email)
            
            authMessage.className = 'auth-message success';
            authMessage.textContent = 'Conta criada com sucesso!';
            authMessage.hidden = false;
            
            setTimeout(() => {
                authMessage.hidden = true;
            }, 3000);
        }) 
        .catch((error) => {
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email já está cadastrado.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido. Verifique o formato.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
            } else if (error.code === 'auth/missing-email') {
                errorMessage = 'Por favor, insira um email.';
            } else if (error.code === 'auth/missing-password') {
                errorMessage = 'Por favor, insira uma senha.';
            }
            
            authMessage.className = 'auth-message error';
            authMessage.textContent = errorMessage;
            authMessage.hidden = false;
            
            console.error("Erro ao criar conta:", error.message);
        });
}



// Log In function
function logIn() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const authMessage = document.getElementById("authMessage");
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            authMessage.className = 'auth-message success';
            authMessage.textContent = 'Login bem sucedido!';
            authMessage.hidden = false;
        }) 
        .catch((error) => {
            let errorMessage = 'Erro ao fazer login. Tente novamente.';
            
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido. Verifique o formato.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado. Verifique seu email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta. Tente novamente.';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Email ou senha incorretos.';
            } else if (error.code === 'auth/missing-email') {
                errorMessage = 'Por favor, insira um email.';
            } else if (error.code === 'auth/missing-password') {
                errorMessage = 'Por favor, insira uma senha.';
            }
            
            authMessage.className = 'auth-message error';
            authMessage.textContent = errorMessage;
            authMessage.hidden = false;
            
            console.error("Erro no login:", error.message);
        });
}

// Log Out function
function logOut() {
    signOut(auth).then(() => {
        console.log("Logout bem sucedido!");
    }).catch((error) => {
        console.error("Erro no logout:", error.message);
    });
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const role = await getUserRole(user.uid);
        
        if (role === 'banned') {
            // User is banned
            whenSignedIn.hidden = true;
            whenSignedOut.hidden = true;
            whenBanned.hidden = false;
            
            // Fetch and display ban reason
            try {
                const banListSnapshot = await get(ref(database, 'admin-data/banned-users/' + user.uid));
                if (banListSnapshot.exists()) {
                    const banReason = banListSnapshot.val().banReason || 'Não especificado';
                    document.getElementById('banReason').textContent = banReason;
                } else {
                    document.getElementById('banReason').textContent = 'Motivo não informado';
                }
            } catch (error) {
                console.error('Erro ao obter motivo do banimento:', error);
                document.getElementById('banReason').textContent = 'Erro ao carregar motivo';
            }
        } else {
            // User is signed in (normal user or admin)
            whenSignedIn.hidden = false;
            whenSignedOut.hidden = true;
            whenBanned.hidden = true;
            
            if (role === 'admin') {
                adminStuff.hidden = false;
            } else {
                adminStuff.hidden = true;
            }
            
            const username = await getUsername(user.uid);
            userDetails.innerHTML = `<h3>Olá, ${username}!</h3>`;
            // Load and display posts
            showPosts();
        }
    } else {
        // User is signed out
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        whenBanned.hidden = true;
        adminStuff.hidden = true;
        userDetails.innerHTML = '';
    }
});

//Função para adcionar usuáro ao banco de dados
function writeUserData(userId, email) {
    name = email.split("@")[0];
    console.log(name);
    set(ref(database, 'users/' + userId), {
        username: name,
        email: email,
        avatar: '👤',
        role: "user",
        'user-posts': ""
    });
}

//Função para pegar o username do usuário
async function getUsername(userId) {
    try {
        const snapshot = await get(ref(database, 'users/' + userId));
        return (snapshot.exists() && snapshot.val().username) || 'Anônimo';
    } catch (error) {
        console.error('Erro ao obter username:', error);
        return 'Anônimo';
    }
}

async function getUserRole(userId) {
    try {
        const snapshot = await get(ref(database, 'users/' + userId));
        return (snapshot.exists() && snapshot.val().role) || 'N/A';
    } catch (error) {
        console.error('Erro ao obter cargo do usuário:', error);
        return 'N/A'
    }
}

async function getProfilePic(userId) {
    try {
        const snapshot = await get(ref(database, 'users/' + userId));
        return (snapshot.exists() && snapshot.val().avatar) || 'N/A';
    } catch (error) {
        console.error('Erro ao obter avatar:', error);
        return 'N/A'
    }
}


async function sendPost() {
    const postText = document.getElementById('postForm').value;
    const user = auth.currentUser;
    const username = await getUsername(user.uid);
    const avatar = await getProfilePic(user.uid);
    const userId = user.uid;

    const postData = {
        author: username,
        uid: userId,
        avatar: avatar,
        postText: postText
    };

    const newPostKey = push(child(ref(database), 'posts')).key;
    const updates = {};
    updates['posts/' + newPostKey] = postData;
    updates['users/' + userId + '/user-posts/' + newPostKey] = postData;

    update(ref(database), updates)
        .then(() => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'post-message success';
            messageDiv.textContent = 'Postagem enviada com sucesso!';
            
            const postFormContainer = document.querySelector('[for="postForm"]').parentElement;
            postFormContainer.appendChild(messageDiv);
            
            document.getElementById('postForm').value = '';
            showPosts();
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        })
        .catch((error) => {
            console.error('Erro ao enviar postagem:', error);
            const messageDiv = document.createElement('div');
            messageDiv.className = 'post-message error';
            messageDiv.textContent = 'Erro ao enviar postagem. Tente novamente.';
            
            const postFormContainer = document.querySelector('[for="postForm"]').parentElement;
            postFormContainer.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        });
}

async function getAllPosts() {
    try {
        const postsRef = ref(database, 'posts');
        const snapshot = await get(postsRef);
        
        if (snapshot.exists()) {
            const posts = snapshot.val();
            // Convert the object to an array of posts with their keys
            const postsArray = Object.keys(posts).map(key => ({
                id: key,
                ...posts[key]
            }));
            return postsArray;
        } else {
            console.log('Nenhum post encontrado');
            return [];
        }
    } catch (error) {
        console.error('Erro ao obter posts:', error);
        return [];
    }
}

async function getBanList() {
    try {
        const banListRef = ref(database, 'admin-data/banned-users');
        const snapshot = await get(banListRef);
        
        if (snapshot.exists()) {
            const banList = snapshot.val();
            const banListArray = Object.keys(banList).map( key => ({
                id: key,
                ...banList[key]
            }));
            return banListArray
        } else {
            console.log("Banlist vazia!");
            return [];
        }
    } catch (error){
        console.error('Erro ao obter banlist:', error);
        return [];
    }
}


async function showPosts() {
    const postsContainer = document.getElementById('posts');
    const postsList = await getAllPosts();
    
    // Clear existing posts (keep header)
    const header = postsContainer.querySelector('h2');
    postsContainer.innerHTML = '';
    postsContainer.appendChild(header);
    
    if (postsList.length === 0) {
        const noPostsMessage = document.createElement('p');
        noPostsMessage.textContent = 'Nenhuma postagem ainda.';
        postsContainer.appendChild(noPostsMessage);
        return;
    }
    
    // Display posts in reverse chronological order (newest first)
    postsList.reverse().forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        postElement.innerHTML = `
            <div class="post-header">
                <span class="post-avatar">${post.avatar}</span>
                <span class="post-author">${post.author}</span>
            </div>
            <p class="post-text">${post.postText}</p>
        `;
        
        postsContainer.appendChild(postElement);
    });
}

async function toggleBanlist() {
    const banlistContainer = document.getElementById("BanList");
    
    if (banlistContainer.hidden === true) {
        // Show the banlist
        await showBanlist();
    } else {
        // Hide the banlist
        banlistContainer.hidden = true;
    }
}

async function showBanlist() {
    const banlistContainer = document.getElementById("BanList");
    const banList = await getBanList();

    banlistContainer.innerHTML = '';
    
    if (banList.length === 0) {
        const noBannedMessage = document.createElement('p');
        noBannedMessage.textContent = 'Nenhum usuário banido.';
        banlistContainer.appendChild(noBannedMessage);
        return;
    }
    
    // Display banned users
    banList.forEach(bannedUser => {
        const bannedUserElement = document.createElement('div');
        bannedUserElement.className = 'banned-user';
        
        bannedUserElement.innerHTML = `
            <div class="banned-user-header">
                <span class="banned-icon">🚫</span>
                <strong class="banned-username">${bannedUser.username}</strong>
            </div>
            <p class="banned-reason">
                <strong>Motivo:</strong> ${bannedUser.banReason || 'Não especificado'}
            </p>
        `;
        
        banlistContainer.appendChild(bannedUserElement);
    });
    
    // Show the banlist container
    banlistContainer.hidden = false;
}

async function banUser(username, reason) {
    try {
        const userId = await getUserIdByUsername(username);
        if (userId) {
            const updates = {};
            updates['admin-data/banned-users/' + userId] = {
                username: username,
                banReason: reason
            };
            updates['users/' + userId + '/role'] = 'banned';
            
            await update(ref(database), updates);
            console.log(`Usuário ${username} banido com sucesso!`);
            return true;
        } else {
            console.error("Usuário não encontrado!");
            return false;
        }
    } catch(error) {
        console.error("Erro ao banir usuário:", error);
        return false;
    }
}

async function handleBanUser() {
    const username = prompt('Digite o nome de usuário a ser banido:');
    if (username && username.trim()) {
        const reason = prompt('Digite o motivo do banimento (opcional):') || 'Não especificado';
        const success = await banUser(username.trim(), reason);
        if (success) {
            alert(`Usuário ${username} foi banido com sucesso!`);
            // Refresh the banlist if it's currently visible
            const banlistContainer = document.getElementById("BanList");
            if (!banlistContainer.hidden) {
                await showBanlist();
            }
        } else {
            alert(`Não foi possível banir o usuário ${username}. Verifique se o nome está correto.`);
        }
    }
}

async function getUserIdByUsername(username) {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // Iterate through all users to find matching username
            for (const [userId, userData] of Object.entries(users)) {
                if (userData.username === username) {
                    return userId; // Return the user ID
                }
            }
            
            // If no user found with that username
            return null;
        } else {
            console.log('Nenhum usuário encontrado no banco de dados.');
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar usuário por nome:', error);
        return null;
    }
}

// Event listeners
signInBtn.addEventListener('click', signIn);
logInBtn.addEventListener('click', logIn);
logOutBtnSignedIn.addEventListener('click', logOut);
logOutBtnBanned.addEventListener('click', logOut);
postar.addEventListener('click', sendPost);
bannedUsersButton.addEventListener('click', toggleBanlist);
banUserButton.addEventListener('click', handleBanUser);

