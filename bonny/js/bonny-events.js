var BonnyEvents = (function () {
    var events = {};
    
    function load() {
        
    }
    
    function play() {
    
    }
    
    function destroy() {
        
    }
    
    function emit(event) {
        events[event].forEach(function(handler) {
            handler();
        })
    }
    
    function subscribe(event) {
        events[event] = [];
        return function(handler) {
            events[event].push(handler);
            console.log(event, events[event]);
        }
    }
    
    return {
        load: load,
        play: play,
        destroy: destroy,
        emit: emit,
        subscribe: subscribe
    }
})(); 