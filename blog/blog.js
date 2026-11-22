function L(l){ document.documentElement.lang=l; try{localStorage.l=l}catch(e){} }
try { L(localStorage.l || (navigator.language.startsWith('en') ? 'en' : 'es')) } catch(e) {}
