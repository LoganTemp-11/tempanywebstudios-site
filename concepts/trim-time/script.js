// Trim Time Barbers concept. Hours are a working assumption until confirmed by the shop:
// Google shows "Open · Closes 6 pm" on a Friday. Everything else is to confirm.
(function(){
  var HOURS = { // 0 = Sunday ... 6 = Saturday. [open, close] in 24h, null = closed
    0:null, 1:[9,18], 2:[9,18], 3:[9,18], 4:[9,18], 5:[9,18], 6:[9,17]
  };
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function fmt(h){ var ampm = h>=12?"pm":"am"; var x=h%12||12; return x+ampm; }
  var now = new Date(), d = now.getDay(), t = now.getHours()+now.getMinutes()/60;
  var el = document.getElementById("status");
  if(el){
    var h = HOURS[d], text, open=false;
    if(h && t>=h[0] && t<h[1]){ open=true; text="Open now · closes "+fmt(h[1]); }
    else if(h && t<h[0]){ text="Opens today at "+fmt(h[0]); }
    else { var n=(d+1)%7, i=0; while(!HOURS[n] && i<7){ n=(n+1)%7; i++; }
      text = "Closed now · opens "+(n===(d+1)%7?"tomorrow":DAYS[n])+" at "+fmt(HOURS[n][0]); }
    el.querySelector("span:last-child").textContent = text;
    el.classList.toggle("closed", !open);
  }
  var rows = document.querySelectorAll(".hours tr");
  rows.forEach(function(r){ if(+r.dataset.day===d) r.classList.add("today"); });

  // Question form. Replace the Web3Forms key when this goes live; until then it says so honestly.
  var form = document.getElementById("askform");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = document.getElementById("formMsg");
      var key = form.querySelector('[name="access_key"]').value;
      if(form.querySelector('[name="botcheck"]').checked){ return; }
      if(key === "REPLACE_WITH_WEB3FORMS_KEY"){ msg.textContent = "This is a preview. Call 07727 934222 and we'll answer right away."; return; }
      var btn = form.querySelector("button"); btn.disabled = true; msg.textContent = "Sending…";
      fetch("https://api.web3forms.com/submit", {method:"POST", body:new FormData(form), headers:{Accept:"application/json"}})
        .then(function(r){ return r.json(); })
        .then(function(j){ msg.textContent = j.success ? "Got it. We'll get back to you." : "That didn't send. Give us a ring instead."; if(j.success) form.reset(); })
        .catch(function(){ msg.textContent = "That didn't send. Give us a ring instead."; })
        .finally(function(){ btn.disabled = false; });
    });
  }
})();
