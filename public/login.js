var loggedUser = {}

function handleSubmitLogin(e) {
    e.preventDefault(); //Previene il reload della pagina

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( { username: username, password: password } ),
    })
    //.then(console.log)

    //Aggiunto al posto di .then(console.log)
    .then(resp => resp.json())
    .then(data => {
        console.log("Risposta dal server:", data);
        document.getElementById("message").textContent = data.message;
    })
    .catch(err => console.error(err));


    /*.then((resp) => resp.json()) // Transform the data into json
    .then(function(data) { // Here you get the data to modify as you please
        //console.log(data);
        loggedUser.token = data.token;
        loggedUser.username = data.username;
        loggedUser.id = data.id;
        loggedUser.ruolo = data.ruolo;
        loggedUser.self = data.self;
        // loggedUser.id = loggedUser.self.substring(loggedUser.self.lastIndexOf('/') + 1);
        document.getElementById("message").textContent = loggedUser.username;
        return;
    })
    .catch( error => console.error(error) );*/ // If there is any error you will catch them here
}

document.getElementById("loginForm").addEventListener("submit", handleSubmitLogin); //doc per prendere doc html, ho dato id al form per prenderlo qui 
