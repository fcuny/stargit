var stargit=(function(){
  var flash;
  var githubNodesObj = {};
  var githubEdgesObj = {};
  var graphAttributes = {};

  function setFlash(){
    if (navigator.appName.indexOf("Microsoft") != -1) {
      flash = window["SiGMa"];
    } else {
      flash = document["SiGMa"];
    }

    if(!flash){
      return false;
    }else{
      return true;
    }
  }

  function setLegend(attName,attribute){
    // First, let's remove all "legend_element" elements:
    $("#legend>*").remove();

    // Then, let's add the new legend elements:
    var legTitle = document.createElement("div");
    legTitle.id = "legend_title";

    $("#legend").append(legTitle);
    $("#legend_title").append("Nodes color: ");

    var fieldB = document.createElement("strong");
    fieldB.style.fontSize = "10px";
    fieldB.innerHTML = (attribute["label"]?attribute["label"]:attName);
    $("#legend_title").append(fieldB);

    var legElements = document.createElement("div");
    legElements.id = "legend_elements";

    $("#legend").append(legElements);
		
    if(attribute["type"]=="Num"){
      var grad = document.createElement("div");
      grad.style.backgroundImage = 
        "-webkit-gradient("+
        "    linear,"+
        "    left top,"+
        "    right top,"+
        "    color-stop(0, "+attribute["colorMax"].replace("0x","#")+"),"+
        "    color-stop(1, "+attribute["colorMin"].replace("0x","#")+"))";
    	    
      grad.style.backgroundImage = 
        "-moz-linear-gradient("+
        "    left center,"+
        "    "+attribute["colorMax"].replace("0x","#")+" 0%,"+
        "    "+attribute["colorMin"].replace("0x","#")+" 100%)";

      $("#legend_elements").append("<br/>");

      grad.style.height = "20px";
      grad.style.width = "80%";
      grad.style.marginLeft = "10%";

      $("#legend_elements").append(grad);

      var lowest = document.createElement("div");
      lowest.style.paddingTop = "5px";
      lowest.style.paddingLeft = "5px";
      lowest.style.float = "left";
      lowest.style.styleFloat = "left";
      lowest.style.cssFloat = "left";
      lowest.style.display = "inline";
      lowest.innerHTML = "(lowest values)";
      $("#legend_elements").append(lowest);

      var highest = document.createElement("div");
      highest.style.paddingTop = "5px";
      highest.style.paddingRight = "5px";
      highest.style.float = "right";
      highest.style.styleFloat = "right";
      highest.style.cssFloat = "right";
      highest.style.display = "inline";
      highest.innerHTML = "(highest values)";
      $("#legend_elements").append(highest);

    }else if(attribute["type"]=="Str"){
      for(var val in attribute["values"]){

        var divname = val.replace(" ", "_");
        var legend  = document.createElement("div");
        legend.id = "value_"+divname;
        legend.style.float="left";
        legend.style.styleFloat = "left";
        legend.style.cssFloat = "left";
        legend.style.width = "110px";
	      legend.style.display = "block";
        $("#legend_elements").append(legend);

        var background = document.createElement("div");
        background.style.width = "13px";
        background.style.height = "13px";
        background.style.marginLeft = "12px";
        background.style.marginTop = "12px";
        background.style.float = "left";
        background.style.styleFloat = "left";
        background.style.cssFloat = "left";
        background.style.border = "1px solid black";
        background.style.backgroundColor = attribute["values"][val].replace("0x","#");
        $("#value_"+divname).append(background);

        var texte = document.createElement("div");
        texte.innerHTML = val + "<br />";
        texte.style.paddingLeft = "3px";
        texte.style.marginTop = "12px";
        texte.style.float = "left";
        texte.style.styleFloat = "left";
        texte.style.cssFloat = "left";
        $("#value_"+divname).append(texte);
      }
    }
  }
	
  // This function refreshes the graph from the login of
  // a user:
  function getGithubGraph(user){
    $("#info_graph_desc").text("Loading a new graph for user "+ user);
    $("#user").hide();
    $("#error").hide();

    url = "/graph/local/"+user;
    $.ajax({
      url: url,
      dataType: 'json',
      error:function(){
        $("#user").hide();
        $("#error").show();
        $("#error_reason").text("Can't find graph for user " + user);
      },
      success:
      function(json){
        if (json.nodes.length == 0){
        }
        $("#info_graph_desc").text("The graph for " + user + " contains " + json.nodes.length + " nodes and " + json.edges.length + " edges");
	resetGraph(json);
	if(document.getElementById("query_input").value)
          document.getElementById("query_input").value = user;
        getNodeDescription(user);
      }
    });
  }

  function resetGraph(graph){
    if(!setFlash()){
      return;
    }
		
    flash.resetGraphPosition();
	
    flash.killForceAtlas();
    flash.deleteGraph();
    flash.updateGraph(graph);
    flash.initForceAtlas();
	  
    if(document.getElementById("query_color").value) flash.setColor(document.getElementById("query_color").value,graphAttributes);
    if(document.getElementById("query_size").value) flash.setSize(document.getElementById("query_size").value);
  }

  // This function updates the comboboxes:
  function setComboBoxes(){
    var colorAtts = [];
    var sizeAtts = [];
		
    for(var att in graphAttributes){
      graphAttributes[att]["id"] = att;
			
      if(graphAttributes[att]["type"]=="Num"){
	sizeAtts.push(graphAttributes[att]);
	colorAtts.push(graphAttributes[att]);
      }else{
	colorAtts.push(graphAttributes[att]);
      }
    }
		
    var nodes_color = document.getElementById("query_color");
    var nodes_size = document.getElementById("query_size");

    while(nodes_color.options.length) nodes_color.options.remove(0);
    while(nodes_size.options.length) nodes_size.options.remove(0);
		
    var i;
    var optn;
		
    var l=colorAtts.length;
    for(i=0;i<l;i++){
      optn = document.createElement("OPTION");
      optn.text = colorAtts[i]["label"] ? colorAtts[i]["label"] : colorAtts[i]["id"];
      optn.value = colorAtts[i]["id"];

      nodes_color.options.add(optn);
    }
		
    l=sizeAtts.length;
    for(i=0;i<l;i++){
      optn = document.createElement("OPTION");
      optn.text = sizeAtts[i]["label"] ? sizeAtts[i]["label"] : sizeAtts[i]["id"];
      optn.value = sizeAtts[i]["id"];

      nodes_size.options.add(optn)
    }

    if(graphAttributes){
      setLegend(colorAtts[0]["label"],colorAtts[0]);
    }
  }

  function getNodeDescription(user){
    var url = "/profile/" + user;
    $.ajax({
      url: url,
      dataType: 'json',
      success:
      function(json){
        $("#error").hide();
        $("#user").show();
        var gravatar = "http://www.gravatar.com/avatar/" + json.gravatar;
        $("#gravatared").attr("src", gravatar);
        $("#gravatared").show();

        var profile_link = document.createElement("a");
        profile_link.setAttribute('href', "http://github.com/"+user);
        profile_link.innerText = user;
        profile_link.text = user;

        if (json.website == 'none'){
          website_link = "none";
        }else{
          var website_link = document.createElement("a");
          website_link.setAttribute('href', json.website);
          website_link.innerText = json.website;
          website_link.text = json.website;          
        }

        $("#user_name").html(profile_link);
        $("#user_website").html(website_link);                        
        $("#user_indegree").text(json.indegree);                        
        $("#user_country").text(json.country);                        
        $("#user_language").text(json.language);                        
      }
    });
  }
  
  // PUBLIC FUNCTIONS:
  return {
    loadUser: function(name){
      getGithubGraph(name);
    },

    setSize: function(e){
      if(!setFlash()) return;
      flash.setSize(e.target.value);
    },

    setColor: function(e){
      if(!setFlash()) return;

      setLegend(e.target.value,graphAttributes[e.target.value]);
      flash.setColor(e.target.value,graphAttributes);
    },
		
    toggleEdges: function(){
      if(!setFlash()) return;
      var areEdgesDisplayed = flash.getDisplayEdges();
      flash.setDisplayEdges(!areEdgesDisplayed);
      return !areEdgesDisplayed;
    },

    toggleLabels: function(){
      if(!setFlash()) return;
      var areLabelsDisplayed = flash.getDisplayLabels();
      flash.setDisplayLabels(!areLabelsDisplayed);
      return !areLabelsDisplayed;
    },

    toggleFishEye: function(){
      if(!setFlash()) return;
      var isFishEye = flash.hasFishEye();
      if(isFishEye){
        flash.deactivateFishEye();
      }else{
        flash.activateFishEye();
      }
      return !isFishEye;
    },

    getGraphAttributes: function(){
      url = "/graph/attributes";

      $.ajax({
        url: url,
        dataType: 'json',
        success:
        function(json){
          graphAttributes = (json && json["attributes"]) ? json["attributes"] : {};
          setComboBoxes();
        }
      });
    },

    onClickNodes: function(nodesArray){
      if(nodesArray.length){
        query = nodesArray[0];

        getGithubGraph(query);
        document.getElementById("query_input").value = query;
		    window.location.hash = query;
      }
    },

    onOverNodes: function(nodesArray){
      if (nodesArray[0]){
        getNodeDescription(nodesArray[0]);
      }
    },
		
    onFlashReady: function(){
      var userNameFromAnchor = window.location.hash.substring(1);

      if(userNameFromAnchor){
        getGithubGraph(userNameFromAnchor);
        document.getElementById("query_input").value = userNameFromAnchor;
      }else{
        var defaultQuery = "github";
        
        getGithubGraph(defaultQuery);
	window.location.hash = defaultQuery;
        document.getElementById("query_input").value = defaultQuery;
      }
    }
  };
})();
