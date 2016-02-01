define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/spotlight/spotlight.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react'),
        $ = require('jquery'),
        typeahead = require('typeahead'),
        bh = require('bloodhound'),
        handlebars = require('handlebars');

    var GEPPETTO = require('geppetto');

    var Spotlight = React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        potentialSuggestions:{},
        suggestions:null,
        instances:null,

        componentDidMount: function () {

            var space = 32;
            var escape = 27;

            var that=this;

            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == space) {
                    that.open(GEPPETTO.Resources.SEARCH_FLOW, true);
                }
            });

            $(document).keydown(function (e) {
                if ($("#spotlight").is(':visible') && e.keyCode == escape) {
                    $("#spotlight").hide();
                    GEPPETTO.trigger(GEPPETTO.Events.Spotlight_closed);
                }
            });

            $('#typeahead').keydown(this, function (e) {
                if (e.which == 9 || e.keyCode == 9) {
                    e.preventDefault();
                }
            });

            $('#typeahead').keypress(this, function (e) {
                if (e.which == 13 || e.keyCode == 13) {
                    that.confirmed($('#typeahead').val());
                }
            });

            $('#typeahead').bind('typeahead:selected', function(obj, datum, name) {
                if(datum.hasOwnProperty("path")){
                    //it's an instance
                    that.confirmed(datum.path);
                }
                else if(datum.hasOwnProperty("label")){
                    //it's a suggestion
                    that.confirmed(datum.label);
                }
            });


            GEPPETTO.on(Events.Experiment_loaded, function () {

                that.instances.add(GEPPETTO.ModelFactory.allPaths);

            });

            //Initializing Bloodhound sources, we have one for instances and one for the suggestions
            this.instances = new Bloodhound({
                datumTokenizer: function(str) { return str.path ? str.path.split(".") : [];},
                queryTokenizer: function(str) { return str ? str.split(/[\.\s]/) : [];},
                identify: function(obj) { return obj.path; }
            });

            this.suggestions = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                identify: function(obj) { return obj.label; }
            });

            Handlebars.registerHelper('geticonFromMetaType', function (metaType) {
                if(metaType){
                    return new Handlebars.SafeString("<icon class='fa " + GEPPETTO.Resources.Icon[metaType] + "' style='margin-right:5px; color:" + GEPPETTO.Resources.Colour[metaType] + ";'/>");
                }
                else{
                    return;
                }

            });

            Handlebars.registerHelper('geticon', function (icon) {
                if(icon){
                    return new Handlebars.SafeString("<icon class='fa " + icon + "' style='margin-right:5px;'/>");
                }else{
                    return;
                }

            });


            this.initTypeahead();

            GEPPETTO.Spotlight=this;


            //TODO: To be removed, just a sample of how to add a suggestion
            this.addSuggestion(this.recordSample,GEPPETTO.Resources.RUN_FLOW);
            this.addSuggestion(this.plotSample,GEPPETTO.Resources.PLAY_FLOW);

        },

        recordSample:{
            "label":"Record all membrane potentials",
            "actions": [
                "var instances=Instances.getInstance(ModelFactory.getAllPotentialInstancesEndingWith('.v'));",
                "$.each(instances,function(index,value){value.setWatched(true);});"
            ],
            "icon": "fa-dot-circle-o"
        },

        plotSample:{
            "label":"Plot all recorded variables",
            "actions": [
                "var p=GEPPETTO.G.addWidget(0).setName('Recorded Variables');",
                "$.each(Project.getActiveExperiment().getWatchedVariables(true,false),function(index,value){p.plotData(value)});"
            ],
            "icon": "fa-area-chart"
        },

        confirmed:function(item){
            //check suggestions

            if(item && item!="") {
                var suggestionFound = false

                if (this.suggestions.get(item)) {
                    var found = this.suggestions.get(item);
                    if (found.length == 1) {
                        suggestionFound = true;
                        var actions = found[0].actions;
                        var allActions = "";
                        actions.forEach(function (action) {
                            allActions = allActions + action;
                        });
                        eval(allActions);
                        $("#typeahead").typeahead('val', "");
                    }
                }

                //check the instances
                if (!suggestionFound) {
                    if (!this.instance || this.instance.getInstancePath() != item) {
                        var instancePath = item;
                        this.instance = Instances.getInstance(instancePath);
                    }
                    if (this.instance) {
                        this.loadToolbarFor(this.instance);

                        if ($(".spotlight-toolbar").length == 0) {
                            this.loadToolbarFor(this.instance);
                        }

                        $(".tt-menu").hide();
                        $(".spotlight-button").eq(0).focus();
                    }
                }

            }
        },

        defaultSuggestions:function(q, sync) {
            if (q === '') {
                sync(this.suggestions.index.all());
            }
            else {
                this.suggestions.search(q, sync);
            }
        },

        defaultInstances:function(q, sync) {
            if (q === '') {
                var rootInstances=[];
                for(var i=0;i<window.Instances.length;i++){
                    rootInstances.push(window.Instances[i].getId());
                }
                sync(this.instances.get(rootInstances));
            }
            else {
                this.instances.search(q, sync);
            }
        },


        initTypeahead:function(){
            $('#typeahead').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 0
                },
                {
                    name: 'suggestions',
                    source: this.defaultSuggestions,
                    limit: 5,
                    display: 'label',
                    templates: {
                        suggestion: Handlebars.compile('<div class="spotlight-suggestion">{{geticon icon}} {{label}}</div>')
                    }
                },
                {
                    name: 'instances',
                    source: this.defaultInstances,
                    limit: 50,
                    display: 'path',
                    templates: {
                        suggestion: Handlebars.compile('<div>{{geticonFromMetaType metaType}} {{path}}</div>')
                    }
                });
            $('.twitter-typeahead').addClass("typeaheadWrapper");
        },



        open:function(flowFilter, useSelection){
            if(useSelection==undefined){
                useSelection=false;
            }
            this.suggestions.initialize(true);
            var that=this;
            if(flowFilter){
                if($.isArray(flowFilter)){
                    $.each(flowFilter,function(index,value){
                        if(that.potentialSuggestions[value]) {
                            that.suggestions.add(that.potentialSuggestions[value]);
                        }
                    });
                }
                else{
                    if(flowFilter && that.potentialSuggestions[flowFilter]) {
                        that.suggestions.add(that.potentialSuggestions[flowFilter]);
                    }
                }

            }
            else{
                $.each(this.potentialSuggestions,function(key,value){
                    that.suggestions.add(value);
                });
            }
            $("#spotlight").show();
            $("#typeahead").focus();
            if(useSelection){
                var selection = GEPPETTO.G.getSelection();
                if (selection.length > 0) {
                    var instance = selection[selection.length - 1];
                    $(".typeahead").typeahead('val', instance.getInstancePath());
                    $("#typeahead").trigger(jQuery.Event("keypress", {which: 13}));
                }
                else{
                    $("#typeahead").typeahead('val', "!"); //this is required to make sure the query changes otherwise typeahead won't update
                    $("#typeahead").typeahead('val', "");
                }
            }
            else{
                $("#typeahead").typeahead('val', "!"); //this is required to make sure the query changes otherwise typeahead won't update
                $("#typeahead").typeahead('val', "");
            }

        },



        addSuggestion:function(suggestion, flow){
            if(flow==undefined){
                flow=GEPPETTO.Resources.SEARCH_FLOW;
            }
            if(!this.potentialSuggestions[flow]){
                this.potentialSuggestions[flow]=[];
            }
            this.potentialSuggestions[flow].push(suggestion);
            if(flow==GEPPETTO.Resources.SEARCH_FLOW){
                //the only suggestions always displayed are those for the search flow
                this.suggestions.add(suggestion);
            }
        },



        BootstrapMenuMaker: {
            named: function (constructor, name, def, instance) {
                return constructor.bind(this)(def, name, instance).attr('id', name);
            },


            buttonCallback: function (button, name, bInstance) {
                var instance = bInstance;
                var that = this;
                return function () {
                    button.actions.forEach(function (action) {
                        GEPPETTO.Console.executeCommand(that.getCommand(action, instance))
                    });
                    $("#" + name).focus();
                }
            },

            statefulButtonCallback: function (button, name, bInstance) {
                var that = this;
                var instance = bInstance;
                return function () {
                    var condition = that.execute(button.condition, instance);
                    var actions = button[condition].actions;
                    actions.forEach(function (action) {
                        GEPPETTO.Console.executeCommand(that.getCommand(action, instance));
                    });
                    that.switchStatefulButtonState(button, name, condition);
                }
            },

            switchStatefulButtonState: function (button, name, condition) {
                $("#" + name)
                    .attr('title', button[condition].tooltip)
                    .removeClass(button[condition].icon)
                    .addClass(button[!condition].icon);
                $("#" + name + " .spotlight-button-label").html(button[!condition].label);
            },

            getCommand: function (action, instance) {
                var processed = action.split("$instance$").join(instance.getInstancePath());
                processed = processed.split("$type$").join(instance.getType().getPath());
                processed = processed.split("$typeid$").join(instance.getType().getId());
                return processed;
            },

            execute: function (action, instance) {
                return eval(this.getCommand(action, instance));
            },

            createButton: function (button, name, instance) {
                var label = null;
                var buttonElement = null;

                if (button.hasOwnProperty("condition")) {
                    var condition = this.execute(button.condition, instance);
                    var b = button[condition];
                    label = $("<div class='spotlight-button-label'>").html(b.label);
                    buttonElement = $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(b.icon)
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', b.tooltip)
                        .attr('container', 'body')
                        .on('click', this.statefulButtonCallback(button, name, instance));
                }
                else {
                    label = $("<div class='spotlight-button-label'>").html(button.label);
                    buttonElement = $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(button.icon)
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', button.tooltip)
                        .attr('container', 'body')
                        .on('click', this.buttonCallback(button, name, instance));
                }

                buttonElement.append(label);
                return buttonElement;
            },

            createButtonGroup: function (bgName, bgDef, bgInstance) {
                var that = this;
                var instance = bgInstance;
                s
                var bg = $('<div>')
                    .addClass('btn-group')
                    .attr('role', 'group')
                    .attr('id', bgName);
                $.each(bgDef, function (bName, bData) {
                    var button = that.named(that.createButton, bName, bData, instance);
                    bg.append(button)
                    $(button).keypress(that, function (e) {
                        if (e.which == 13 || e.keyCode == 13)  // enter
                        {
                            if (button.hasOwnProperty("condition")) {
                                e.data.statefulButtonCallback(button, instance);
                            }
                            else {
                                e.data.buttonCallback(button, instance);
                            }

                        }
                    });
                    $(button).keydown(that, function (e) {
                        if (e.which == 27 || e.keyCode == 27)  // escape
                        {
                            $(".spotlight-toolbar").remove();
                            $('#typeahead').focus();
                            e.stopPropagation();
                        }
                    });
                    $(button).keydown(function (e) {
                        if (e.which == 9 || e.keyCode == 9)  // tab
                        {
                            e.preventDefault();
                            var next = $(this).next();
                            if (next.length == 0) {
                                //check if there is a sibling of the parent, i.e. another buttonGroup
                                var nextParent = $(this).parent().next();
                                if (nextParent.length > 0) {
                                    next = $(nextParent).eq(0).children(" .spotlight-button").eq(0);
                                }
                                else {
                                    next = $(".spotlight-button").eq(0);
                                }
                            }
                            $(next).focus();
                        }
                    });
                    $(button).mouseover(function (e) {
                        $(button).focus();
                    });
                    $(button).mouseout(function (e) {
                        $(".typeahead-wrapper").focus();
                    })
                });
                return bg;
            },

            generateToolbar: function (buttonGroups, instance) {
                var that = this;
                var tbar = $('<div>').addClass('spotlight-toolbar');
                $.each(buttonGroups, function (groupName, groupDef) {
                    if ((instance.get("capabilities").indexOf(groupName) != -1) ||
                        (instance.getType().getMetaType() == groupName)) {
                        tbar.append(that.createButtonGroup(groupName, groupDef, instance));
                    }
                });

                return tbar;
            }
        },

        loadToolbarFor: function (instance) {
            $(".spotlight-toolbar").remove();
            $('#spotlight').append(this.BootstrapMenuMaker.generateToolbar(this.configuration.SpotlightBar, instance));

        },

        render: function () {
            return <input id = "typeahead" className = "typeahead" type = "text" placeholder = "Lightspeed Search" />
        },


        configuration: {
            "SpotlightBar": {
                "CompositeType": {
                    "type": {
                        "actions": [
                            "G.addWidget(3).setData($type$).setName('$typeid$')",
                        ],
                        "icon": "fa-puzzle-piece",
                        "label": "Explore type",
                        "tooltip": "Explore type"
                    }
                },
                "VisualCapability": {
                    "buttonOne": {
                        "condition": "$instance$.isSelected()",
                        "false": {
                            "actions": ["$instance$.select(true)"],
                            "icon": "fa-hand-stop-o",
                            "label": "Unselected",
                            "tooltip": "Select"
                        },
                        "true": {
                            "actions": ["$instance$.deselect(true)"],
                            "icon": "fa-hand-rock-o",
                            "label": "Selected",
                            "tooltip": "Deselect"
                        },
                    },
                    "buttonTwo": {
                        "condition": "$instance$.isVisible()",
                        "false": {
                            "actions": [
                                "$instance$.show(true)"
                            ],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show"
                        },
                        "true": {
                            "actions": [
                                "$instance$.hide(true)"
                            ],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide"
                        }

                    },
                    "buttonThree": {
                        "actions": [
                            "$instance$.zoomTo()"
                        ],
                        "icon": "fa-search-plus",
                        "label": "Zoom",
                        "tooltip": "Zoom"
                    },
                },
                "ParameterCapability": {
                    "buttonOne": {
                        "actions": [
                            "$instance$.setValue($value)"
                        ],
                        "icon": "fa-i-cursor",
                        "label": "Set value",
                        "tooltip": "Set parameter value"
                    }
                },
                "StateVariableCapability": {
                    "watch": {
                        "condition": "$instance$.isWatched()",
                        "false": {
                            "actions": ["$instance$.setWatched(true)"],
                            "icon": "fa-circle-o",
                            "label": "Not recorded",
                            "tooltip": "Record the state variable"
                        },
                        "true": {
                            "actions": ["$instance$.setWatched(false)"],
                            "icon": "fa-dot-circle-o",
                            "label": "Recorded",
                            "tooltip": "Stop recording the state variable"
                        }
                    },
                    "plot": {
                        "actions": [
                            "G.addWidget(0).plotData($instance$).setName('$instance$')",
                        ],
                        "icon": "fa-area-chart",
                        "label": "Plot",
                        "tooltip": "Plot state variable"
                    }
                }

            }

        },
    });

    React.renderComponent(Spotlight({}, ''), document.getElementById("spotlight"));
});