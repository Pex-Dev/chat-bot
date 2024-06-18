//Integra WebLLM a través de CDN
import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

//Elementos del dom
const form = document.querySelector('form');
const input = document.querySelector('input');
const template = document.querySelector('#message-template');
const messages = document.querySelector('ul');
const container = document.querySelector('main');
const button = document.querySelector('button');
const info = document.querySelector('small');
const modal = document.querySelector('.modal');
const selectorModelo = document.querySelector('.selector-modelo');
const loader = document.querySelector('.loading');
const loaderMessage = document.querySelector('#loading-message');
const noWebGPU = document.querySelector('.no-webgpu');
const btnComenzar = document.querySelector('#btnComenzar');

let listMessages = [];

//Establecer modelo de inteligencia artificial
let  SELECTED_MODEL = "gemma-2b-it-q4f32_1-MLC";

if (navigator.gpu) {//Revisar si el navegador soporta WebGPU
    if(hasWebGLSupport()){
        btnComenzar.addEventListener('click',()=>{
            SELECTED_MODEL = getSelectedValue();//Obtiene el modelo seleccionado por el usuario
            ocultar(selectorModelo);//Oculta el selector de modelo
            mostrar(loader);//Muestra el loader
            startBot();//Comienza a cargar el chat
        })
    }else{
        ocultar(selectorModelo);//Oculta el modelo
        mostrar(noWebGPU)//Muestra el aviso de webGPU no soportada
    }    
}else{
    ocultar(selectorModelo);//Oculta el modelo
    mostrar(noWebGPU)//Muestra el aviso de webGPU no soportada
}

async function startBot() {
    try {
        // Crear motor
        const engine = await CreateWebWorkerMLCEngine(
            new Worker('js/worker.js', { type: 'module' }),
            SELECTED_MODEL,
            {
                initProgressCallback: (i) => {
                    loaderMessage.innerHTML = i.text;            
                }
            }
        );
        modal.style.display = 'none';//Quita el modal una vez se ha cargado el modelo
        button.removeAttribute('disabled');//Habilita el boton de enviar
        addMessage('¿Hola en que puedo ayudarte?', 'bot');//Añade el mensaje inicial del bot

        form.addEventListener('submit', async (e) => {
            e.preventDefault();//Previene el comportamiento por defecto al enviar el formulario
            const messageText = input.value.trim();//Elimina los espacios en blanco del mensaje enviado por el usuario

            if (messageText != '') {//Se revisa si el mensaje no esta en blanco antes de enviarlo
                input.value = '';//Limpia el imput
                addMessage(messageText, 'user');//Añade el mensaje al chat
                button.setAttribute('disabled', true);//Sehabilita el boton de enviar

                const userMessage = {
                    role: 'user',
                    content: messageText
                };
            
                listMessages.push(userMessage);//Añade el mensaje del ususario a la lista

                const chunks = await engine.chat.completions.create({//Generar las repsuestas
                    messages: listMessages,//Pasa la lista de mensajes
                    stream: true//Permite obtener la respuesta en trozos
                });

                let reply = "";
                
                const botMessage = addMessage('', 'bot');//Añade el mensaje del bot al que se le añadiran los trozos de la respuesta

                for await (const chunk of chunks) {//Recorre los trozos de la respuesta
                    const choice = chunk.choices[0];
                    const content = choice?.delta?.content ?? "";
                    reply += content;
                    reply = convertirTexto(reply);
                    botMessage.innerHTML = reply;//Va añadiendo los trozo de la respuesta al mensaje
                    scrollear();//Hace scroll hacia abajo
                }            

                button.removeAttribute('disabled');//Activa nuevamente el boton enviar

                listMessages.push({//Añade la respuesta del bot a la lista de mensajes
                    role: 'assistant',
                    content: reply
                });            
            }
        });
    } catch (error) {
        console.error('Error al iniciar el bot:', error);
        noWebGPU.classList.remove('hidden');
        loader.classList.add('hidden');
        info.textContent = 'Error al iniciar el bot: ' + error.message;
    }
}


function addMessage(text,sender){//Recibe el mensaje y quien lo envio
    //Clonar template
    const newTemplate = template.content.cloneNode(true);
    const newMessage = newTemplate.querySelector('.message');//Obtiene el mensaje

    const who = newMessage.querySelector('span');//Obtiene el span que contiene quien mando el mensaje
    const textContainer = newMessage.querySelector('p');//Obtiene el parrafo que contiene el texto del mensaje

    who.textContent = sender == 'bot' ? 'Bot' : 'Tú';//Si el sender el bot se pondrá GPT si no Tú
    textContainer.innerHTML = text;//Pasa el mensaje
    newMessage.classList.add(sender)//Agregamos la clase 

    //Añadir mensaje
    messages.appendChild(newMessage);

    //Scrollear hacia abajo
    container.scrollTop = container.scrollHeight; //La posicion del scroll vertical de container sera igual a la altura del scroll
    
    return textContainer;
}

function convertirTexto(texto) {
    texto = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    texto = texto.replace(/\n\n/g, '<br>');
    return texto;
}

function getSelectedValue() {
    const selectElement = document.querySelector('#modelSelect');
    return selectElement.value;
}

function hasWebGLSupport() {
    try {
        var canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

function mostrar(elemento){
    elemento.classList.remove('hidden');
}
function ocultar(elemento){
    elemento.classList.add('hidden');
}

function scrollear(){
    container.scrollTop = container.scrollHeight;
}