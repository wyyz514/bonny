var BonnyIndicators = (function(){
    
    var config = {
        'style': 'bars',
        'count': 0
    }
    
    function previousIndicator() {
        var activeIndicator = document.getElementById('bi-active');
        activeIndicator.setAttribute('id', '');
        var activeHeir = activeIndicator.previousElementSibling;
        activeHeir.setAttribute('id', 'bi-active');
        activeHeir = null;
        activeIndicator = null;
    }
    
    function nextIndicator() {
        var activeIndicator = document.getElementById('bi-active');
        activeIndicator.setAttribute('id', '');
        var activeHeir = activeIndicator.nextElementSibling;
        activeHeir.setAttribute('id', 'bi-active');
        activeHeir = null;
        activeIndicator = null;
    }
    
    function updateConfig(opts, value) {
        if(typeof opts == "string" && config.hasOwnProperty(opts)) {
            config[opts] = value;
            return config;
        }
        else if(typeof opts == "object") {
            var configKeys = Object.keys(config);
            configKeys
                .filter(function(prop){
                if(config.hasOwnProperty(prop)) {
                    return prop; 
                }
            }).map(function(prop){
                config[prop] = opts[prop];
            });
        } 
        else {
            return null;
        }
        return config;
    }
    
    function render() {
        var counted = 0;
        var container = document.createElement('div');
        container.classList.add('bonny-indicators');
        document.body.appendChild(container);
    
        while(counted < config.count) {
            var indicator = document.createElement('div');
            indicator.classList.add('bonny-indicator');
            indicator.classList.add(config.style);
            
            if(counted == 0) {
                indicator.setAttribute('id', 'bi-active');
            }
            container.appendChild(indicator);
            counted += 1;
        }
        
        return true;
    }
    
    return {
        previous: previousIndicator,
        next: nextIndicator,
        updateConfig: updateConfig,
        render: render
    }
    
})();