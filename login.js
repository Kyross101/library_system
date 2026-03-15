const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})


// TOAST NOTIFICATIONS
function showtoast(message, type = "success") {

    let toastContainer = document.getElementById("toast-container");

    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.textContent = message;

    toast.style.background = type === "success" ? "#4BB543" : "#FF3333";
    toast.style.color = "#fff";
    toast.style.padding = "10px 20px";
    toast.style.marginTop = "10px";
    toast.style.borderRadius = "6px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    toast.style.fontFamily = "Poppins, sans-serif";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    toast.style.transition = "all 0.4s ease";

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(40px)";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}


// login.js
const loginForm = document.querySelector('.login form');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = loginForm.querySelector('input[placeholder="Username"]').value.trim();
    const password = loginForm.querySelector('input[placeholder="Password"]').value.trim();

    if(username && password){
        if(username === "admin" && password === "1234"){
            showtoast("Logged in successfully!", "success");
            setTimeout(() => window.location.href = "dashboard.html", 1200);
        } else {
            showtoast("Invalid username or password", "error");
        }
    } else {
        showtoast("Please fill all fields", "error");
    }
});

// register.js
const registerForm = document.querySelector('.register form');

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = registerForm.querySelector('input[placeholder="Username"]').value.trim();
    const email = registerForm.querySelector('input[placeholder="Email"]').value.trim();
    const password = registerForm.querySelector('input[placeholder="Password"]').value.trim();

    if(username && email && password){
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push({username, email, password});
        localStorage.setItem('users', JSON.stringify(users));
        showtoast("Registered successfully!", "success");
        registerForm.reset();
    } else {
        showtoast("Please fill all fields", "error");
    }
});