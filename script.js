const authButton = document.getElementById("authButton");

if (authButton) {
  if (localStorage.getItem("loggedIn") === "true") {
    authButton.innerHTML = `<a href="#" onclick="logout()">Logout</a>`;
  } else {
    authButton.innerHTML = `<a href="login.html">Login / Signup</a>`;
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}