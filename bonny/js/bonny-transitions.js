var BonnyTransitions = (function (){

    var defaultIn = function () {
        this.classList.add('active');
    }

    var defaultOut = function () {
        this.classList.remove('active');
    }

    var transitions = { 
        "fade-up": {
            "in": defaultIn,
            "out": defaultOut
        },
        "fade-down": {
            "in": defaultIn,
            "out": defaultOut
        },
        "fade-left": {
            "in": defaultIn,
            "out": defaultOut
        },
        "fade-right": {
            "in": defaultIn,
            "out": defaultOut
        }
    };

    function register(name, en, out) {
        transitions[name] = {
            'in': en,
            'out': out
        }
        return transitions[name];
    }

    function get(name) {
        return transitions[name];
    }

    function trigger(el, dir) {
        var self = this;
        //helps with scroll back animations (setTimeout)
        setTimeout(function(){
            var hasAnimation = el.classList.contains('has-animation');

            if (hasAnimation) {
                var classNames = Array.prototype.slice.call(el.classList).slice(0);
                var registeredTransitions = Object.keys(transitions);

                var toTrigger = 
                    classNames
                .filter(function(name){
                    if(registeredTransitions.indexOf(name) > -1) {
                        return name;
                    }
                }).map(function(transition){
                    if(dir == "down") {
                        self.get(transition).in.call(el);
                    }

                    if(dir == "up") {
                        self.get(transition).out.call(el);
                    }

                    return transition;
                });
            }


            var children = Array.prototype.slice.call(el.children);
            children.forEach(function(child){
                self.trigger(child, dir);
            });
        }, 250);

    }
    return {
        register: register,
        trigger: trigger,
        get: get
    }
})();
