// const socket = io()

// socket.on("countUpdated", (count) => {
//     console.log("The count has been updated!", count); 
// });

// document.querySelector("#increment").addEventListener( "click", () => {
//     console.log("Button Clicked!");
//     socket.emit("increment", count);
// } );

const socket = io();

const $form = document.querySelector("#form");
const $userMessage = $form.querySelector("#inputMessage");
const $messageButton = $form.querySelector("#increment");
const $locationButton = document.querySelector("#sendLocation")
const $messages = document.querySelector("#messages")
const $location = document.querySelector("#location")

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true } )

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if( containerHeight - newMessageHeight <= scrollOffset ){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on( "welcome", (message) => {
    console.log(message.text);
    const html = Mustache.render(messageTemplate, { username:message.username, message: message.text, createdAt: moment( message.createdAt ).format("h:mm a") } );
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll();
} )

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})


socket.on( "locationMessage", (locationMessage) => {
    console.log(locationMessage.text);
    const html = Mustache.render(locationTemplate, { username:locationMessage.username, locationMessage: locationMessage.text, createdAt: moment( locationMessage.createdAt ).format("h:mm a") });
    $messages.insertAdjacentHTML("beforeend", html);
    autoScroll()
} )

form.addEventListener("submit", (e) => {
    e.preventDefault();
    // const inputMessage = document.querySelector("#inputMessage");
    // const userMessage = inputMessage.value;
    $messageButton.setAttribute("disabled", "disabled")
    const userMessage = e.target.elements.message.value;
    if( userMessage && userMessage.length ){
        socket.emit("userMessage", userMessage, (error, message) => {
            $messageButton.removeAttribute("disabled")
            $userMessage.value = "";
            $userMessage.focus();
            if(error){
                return console.log(error);
            }
            console.log(message);
        })
    }
})

document.querySelector("#sendLocation").addEventListener("click", () => {
    if(!navigator.geolocation){
        return alert("Geolocation is not supported by your browser.")
    }
    $locationButton.setAttribute("disabled", "disabled")
    navigator.geolocation.getCurrentPosition( (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        socket.emit("location", { lat, long }, (message) => {
            $locationButton.removeAttribute("disabled")
            console.log(message);
        });
    } )
})

socket.emit("join", { username, room }, (error) => {
    if( error ){
        alert(error);
        location.href = "/";
    }
})