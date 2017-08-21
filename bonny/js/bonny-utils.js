var BonnyUtils = (function(){

    var globals = {
        //bounds are 0 and number of top level items - 1
        currentBonny: 0,
        root: null
    };

    var _globals = {
        get: function get(prop) {
            var propCopies = {};

            if (!prop) {
                return null;
            }

            if (typeof prop == "string") {
                return globals[prop];
            }

            prop.map(function(p){
                if (globals[p]) {
                    propCopies[p] = globals[p];
                }
                return p;
            });

            return propCopies;
        },
        set: function set(prop, value) {
            if (!prop) {
                return null;
            }

            if (typeof prop == "string") {
                globals[prop] = value;
                return value;
            }

            if (typeof prop == "object") {
                var keys = Object.keys(prop);
                keys.map(function(keyProp) {
                    globals[keyProp] = prop[keyProp];
                })
            }
        },

        //shitty walk function since it has to start from root each
        //time but if it aint broke...
        walk: function walk(name, root) {
            var path = name.split(".");
            var pathIndex = 1;
            var pathLength = path.length;

            function walker(p, i, current) {
                var toPassNext = null;
                //since we start from index 1 to ignore the body container in index 0,
                //if the path does not have a definition, then return where we currently are
                //so for instance if the name passed is just 1, then there is no index 1 in the array
                //so simply return current which is the body root in this case

                //also return if the path index is greater than or equal to the number of children
                //of the current item/container to prevent out of bounds
                if(i >= pathLength || p[i] == undefined || p[i] >= current.children) {
                    return current;
                }

                if (current.type == "item") {
                    //0 to return first child
                    //check nextContainer function
                    var containerCount = 0;
                    var container = null;

                    while( containerCount <= parseInt(p[i]) ) {
                        container = current.nextContainer(containerCount);
                        containerCount += 1;
                    }
                    toPassNext = container;

                } else {
                    var itemCount = 0;
                    var item = null;

                    while( itemCount <= parseInt(p[i]) ) {
                        item = current.nextItem(itemCount);
                        itemCount += 1;
                    }
                    toPassNext = item;
                }

                return walker(p, i + 1, toPassNext);
            }

            return walker(path, pathIndex, root);
        },

        collectMouseScrolls: function collectMouseScrolls() {
            //leverage scoping to populate the scrolls array
            //each time the nested function is called
            var scrolls = [];

            return function (scroll) {
                
                if (scrolls.length < 3 ) {
                    scrolls.push(scroll);
                    return {
                        then: function(cb) {
                        }
                    };
                }
                else {
                    var sum = scrolls.reduce(function(prev, next) {
                        return prev + next;
                    }, 0);
                    scrolls = [];
                    return new Promise(function(resolve, reject){
                        resolve((sum < 0 ? "up" : "down"));
                    });
                }
            }
        },

        changeBonny: function changeBonny(direction) {
            
            var currentPage = function() {
                return this.get("currentBonny") % this.get('root').children;
            }.bind(this);

            var bonnySelector = this.getSelector(false, this.get('root').bonnyItems[currentPage()]);
            var el = document.querySelector(bonnySelector);
            var noScrollUp = el.classList.contains('no-up');
            var noScrollDown = el.classList.contains('no-down');

            //going from first to last
            if (direction == "down" && !noScrollDown) {

                this.set('currentBonny', this.get('currentBonny') + 1);
                current = this.get('root').bonnyItems[currentPage()];
                el = document.querySelector(this.getSelector(false, current));
                el.previousElementSibling.classList.add('fade');
                BonnyIndicators.next();
            }
            //going from last to first
            else if(direction == "up" && !noScrollUp) {
                this.set('currentBonny', this.get('currentBonny') - 1);
                current = this.get('root').bonnyItems[currentPage()];
                el = document.querySelector(this.getSelector(false, current));
                el.classList.remove('fade');
                BonnyIndicators.previous();
            }
            else {
                //do nothing for out of bounds events
            }
            
            return current;
        },

        //step through all the children of a node
        //step out to the node's parent when done
        step: function step(root) {
            var currentNode = root;
            return {
                stepForward: function _step(node) {
                    if (node) {
                        currentNode = node;
                    }
                    var bound = currentNode.children - 1;
                    if(this.currentChild(currentNode) < bound && bound != -1) {
                        currentNode = currentNode.type === "container" ? currentNode.nextItem() : currentNode.nextContainer();
                    }
                    //when body is reached and all its children have been walked, just return it
                    else if(currentNode.name == "1") {
                        return currentNode;
                    }
                    else {
                        //we have walked the current node's children, so return to the current node's parent to walk its siblings if any
                        //(currentNode.currentItem ? currentNode.currentItem = -1 : currentNode.currentContainer = -1);
                        currentNode = this.stepOut(currentNode, 1);
                    }
                    return currentNode;
                }.bind(this)
                ,
                stepBack: function _stepBack(node) {
                    if (node) {
                        currentNode = node;
                    }

                    var bound = currentNode.children - 1;
                    if(this.currentChild(currentNode) > 0 && bound != -1) {
                        currentNode = currentNode.type === "container" ? currentNode.prevItem() : currentNode.prevContainer();
                    }

                    else if(currentNode.name == "1") {
                        return currentNode;
                    }
                    else {
                        //(currentNode.currentItem ? currentNode.currentItem = -1 : currentNode.currentContainer = -1);
                        currentNode = this.stepOut(currentNode, -1);
                    }
                    return currentNode;
                }.bind(this)
            }
        },

        stepOut: function stepOut(node) {
            var name = node.name;
            //remove last digit and preceding dot to get parent address

            var parentName = name.slice(0, name.length - 2);
            var parent = this.walk(parentName, globals.root);
            //last condition is to prevent increment on childless nodes so the current remains -1
            if(this.currentChild(parent) == parent.children - 1 && arguments[1] == 1 && parent.children != 0) {
                this.nextChild(parent);
            }

            if(this.currentChild(parent) == 0 && arguments[1] == -1) {
                this.previousChild(parent);
            }
            // else
            // (parent.currentItem ? parent.children : parent.children);
            return parent;
        },

        currentChild: function currentChild(bonny) { 
            if(bonny.type == 'item') {
                return bonny.currentContainer;
            }
            else if(bonny.type == 'container') {
                return bonny.currentItem;
            }
            else {
                return null;
            }
        },

        previousChild: function previousChild(bonny) {
            if(bonny.type == 'item') {
                return bonny.currentContainer < 0 ? -1 : bonny.currentContainer -= 1;
            }
            else  if(bonny.type == 'container') {
                return bonny.currentItem < 0 ? -1 : bonny.currentItem -= 1;
            }
            else {
                return null;
            }
        },

        nextChild: function nextChild(bonny) {
            if(bonny.type == 'item') {
                return bonny.currentContainer += 1;
            }
            else  if(bonny.type == 'container') {
                return bonny.currentItem += 1;
            }
            else {
                return null;
            }
        },

        getSelector: function getSelector(isBody, bonny) {
            if (isBody) {
                return 'body[bonny-id="'+bonny.name+'"]';
            }

            if (bonny.type == "item") {
                return '.bonny-item[bonny-id="'+bonny.name+'"]'
            }

            if (bonny.type == "container") {
                return '.bonny-container[bonny-id="'+bonny.name+'"]'
            }

            return "";
        },
        execute: function execute(scroll, directions) {
            var self = this;
            
            this.collectMouseScrolls(scroll).then(function(direction){
                var temp = null;
                if(direction == "up") {
                    temp = directions.stepBack();
                    if(temp.name != '1') {    
                        var selector = self.getSelector(false, temp);
                        BonnyTransitions.trigger(document.querySelector(selector), direction);
                    }
                }
                else if(direction == "down") {
                    temp = directions.stepForward();
                    if(temp.name != '1') {
                        var selector = self.getSelector(false, temp);
                        BonnyTransitions.trigger(document.querySelector(selector), direction);    
                    }
                }
                else {
                    //
                }

                if(temp.name == '1') {
                    window.pause = true;
                    setTimeout(function(){
                        window.pause = false;
                        self.changeBonny(direction);
                    }, 1500);
                }
            });
        }
    }



    return {
        walk: function(name, root) {
            return _globals.walk(name, root);
        },
        collectMouseScrolls: _globals.collectMouseScrolls(),
        changeBonny: function(direction) {
            return _globals.changeBonny(direction);    
        },
        step: function(root) {
            return _globals.step(root);
        },
        stepOut: function(root) {
            return _globals.stepOut(root);        
        },
        execute: function(scroll, directions) {
            return _globals.execute.call(this, scroll, directions);
        },
        getSelector: function(isBody, bonny) {
            return _globals.getSelector(isBody, bonny);
        },
        set: function(prop, value) {
            return _globals.set(prop, value);    
        },
        get: function(prop) {
            return _globals.get(prop);
        },
        currentChild: function(bonny) {
            return _globals.currentChild(bonny);
        },
        previousChild: function(bonny) {
            return _globals.previousChild(bonny);
        },
        nextChild: function(bonny) {
            return _globals.nextChild(bonny);
        }
    }
})();
