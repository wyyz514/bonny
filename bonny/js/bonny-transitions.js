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

    function trigger(page, dir, directions) {
        var self = this;
        window.pause = true;

        function doneAnimating(children) {
            function whichTransitionEvent(el){
                var t;

                var transitions = {
                    'transition':'transitionend',
                    'OTransition':'oTransitionEnd',
                    'MozTransition':'transitionend',
                    'WebkitTransition':'webkitTransitionEnd'
                }

                for(t in transitions){
                    if( el.style[t] !== undefined ){
                        return transitions[t];
                    }
                }
            }


            var promised = children.map(function(child){
                return new Promise(function(resolve, reject){
                    
                    var transitionEvent = whichTransitionEvent(child);
                    
                    transitionEvent && child.addEventListener(transitionEvent, function(e) {
                        resolve();
                    });


                    var classNames = Array.prototype.slice.call(child.classList).slice(0);
                    var registeredTransitions = Object.keys(transitions);

                    var toTrigger = 
                        classNames
                    .filter(function(name){
                        if(registeredTransitions.indexOf(name) > -1) {
                            return name;
                        }
                    }).map(function(transition){
                    
                        if(dir == "down") {
                            self.get(transition).in.call(child);
                        }

                        if(dir == "up") {
                            self.get(transition).out.call(child);
                        }

                        return transition;
                    });
                });
            });

            return new Promise(function(resolve, reject) {

                Promise.all(promised).then(function(){
                    resolve(true);
                });

            });
        }

        function _trigger(node) {
            
            if(node.name == "1") { 
                
                window.pause = true;
                setTimeout(function(){
                    BonnyUtils.changeBonny(dir);
                    window.pause = false;
                }, 1500)
                return;
                
            }

            var el = document.querySelector(BonnyUtils.getSelector(false, node));

            var hasAnimation = el.hasAttribute('bonny-animate');


            if (hasAnimation) {
                doneAnimating(Array.prototype.slice.call(el.querySelectorAll('.has-animation'))).then(function(){
                    console.log("done all animations for", node.name);
                    window.pause = false;
                    _trigger(dir == "up" ? directions.stepBack(node) : directions.stepForward(node));
                });
            }
            else {
                window.pause = true;
                _trigger(dir == "up" ? directions.stepBack(node) : directions.stepForward(node));
            }
        }
        _trigger(page);
    }
    return {
        register: register,
        trigger: trigger,
        get: get
    }
})();
