function hamburg(){
    const navbar = document.querySelector(".dropdown")
    navbar.style.transform = "translateY(0px)"
}
function cancel(){
    const navbar = document.querySelector(".dropdown")
    navbar.style.transform = "translateY(-500px)"
}
// Typewriter Effect
const texts = [
    "DEVELOPER",
    "DESIGNER",
    "GAMER"
]
let speed  =100;
const textElements = document.querySelector(".typewriter-text");
let textIndex = 0;
let charcterIndex = 0;
function typeWriter(){
    if (charcterIndex < texts[textIndex].length){
        textElements.innerHTML += texts[textIndex].charAt(charcterIndex);
        charcterIndex++;
        setTimeout(typeWriter, speed);
    }
    else{
        setTimeout(eraseText, 1000)
    }
}
function eraseText(){
    if(textElements.innerHTML.length > 0){
        textElements.innerHTML = textElements.innerHTML.slice(0,-1);
        setTimeout(eraseText, 50)
    }
    else{
        textIndex = (textIndex + 1) % texts.length;
        charcterIndex = 0;
        setTimeout(typeWriter, 500)
    }
}
window.onload = typeWriter


var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname){
    for(tablink of tablinks){
        tablink.classList.remove("active-link");
    }
    for(tabcontent of tabcontents){
        tabcontent.classList.remove("active-tab");
    }
    
    //add active link and active tab and show the content
    event.currentTarget.classList.add("active-link");
    document.getElementById(tabname).classList.add("active-tab");

}



document.querySelectorAll('a.scroll-to-top').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});


//link to the google sheets page --> CONTACT ME SECTION

document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    // Replace this URL with your Google Apps Script Web App URL

    //https://docs.google.com/spreadsheets/d/19ryH6MVGwQX8e9Jz4mX5ms4NTT_wQDMDoUy5OvklwVA/edit?gid=0#gid=0
    //19ryH6MVGwQX8e9Jz4mX5ms4NTT_wQDMDoUy5OvklwVA

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_eWoYNlrM5i9szYJ7pVcxVf3H2QeobGFTKSF_7fXVfqdmCBdTHRYGdlJ4YzHs0jWg/exec';

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // Show success message
        showToast('Message sent successfully!');
        
        // Reset form
        this.reset();
    } catch (error) {
        showToast('Error sending message. Please try again.', 'error');
    }
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = type === 'success' ? '#077b32' : '#ef4444';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
