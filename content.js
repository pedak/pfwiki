// ProFuse Wikipedia Adapter 
// v0.12
// Peter Kalchgruber
// University of Vienna


bootstrap();
var equals={};

function bootstrap(){
	// injects html div and infobar into webpage
	var imgURL = chrome.extension.getURL("ajax-loader.gif");
	$('<div id="ticker"><span id="pfinfo">No Updates</span> <img id="ajaxloader" src="'+imgURL+'	"/>').insertBefore('#siteSub');
	$('#ticker').append('<div id="pfajax"><span id="numpend">0</span> pending requests</div></div>');
	$('<div id="pfdetail">Loading...</div>').insertBefore('#mw-content-text');
	start(document.URL);
}

function start(url){
	// searches sameas db for equivalences of wikipedia/dbpedia resource
	
	var equalsURL = 'http://sameas.org/json?uri=';
	var dbPediaURL = "http://dbpedia.org/resource/";
	resource=url.match("[a-zA-Z_.-]*$");
	rURL=equalsURL+dbPediaURL+resource;
	console.log("Searching equals @: ",rURL);
	$.getJSON(rURL, callback_sameas);
}

function callback_sameas(data){
	// callback of sameas ajax call
	
	duplicates=data[0].duplicates;
	queryEquals(duplicates);
}


/**
	* query each duplicate datasource once
	* request rdf+xml datatype
	* if modified and success proceed with equal_success
*/
function queryEquals(duplicates){
	// query equals
	
	var visited={};		//visit each host only once per crawl to avoid blacklisting
	$.each(duplicates, function(key, url) {
		if (!visited[url_domain(url)]>0){
			visited[url_domain(url)]=1;
			console.log("Querying: ",url);
			$.ajax({
				beforeSend: function (xhr){ 
				        xhr.setRequestHeader("Content-Type","application/rdf+xml","text/xml","application/xml");
				        xhr.setRequestHeader("Accept","application/rdf+xml","text/xml","application/xml");
						updatePendingTicker(1);
					},
				url: url,
				ifModified: true,
				success: function(data,status) {
		       		if(status=="success"){
						equal_success(url, data);
					}
				},
				complete: function(data,status){
					updatePendingTicker(-1);
		       		if(status=="notmodified"){
						console.log("Not modified: " + " url");
					}
				},
				error: function(data,status){
					console.error("Could not open url: " + url);
				}
					
			});
		}
	});
}

function updatePendingTicker(val){
	//updates pending requests ticker to current pending requests number
	
	curval=parseInt($('#numpend').text());
	curval+=val;
	$('#numpend').text(curval);
	if(curval>0){
		$('#ajaxloader').css("display","inline");
	}else{
		$('#ajaxloader').css("display","none");
	}
}

function equal_success(url,data){
	// callback function of equals call
	
	var dlength=data.length
	if(dlength==null){ //will be called if data != string (e.g. RDF)
		dlength = new XMLSerializer().serializeToString(data).length;
	}
	console.log("Successfully checked ",url," with length: ",dlength);
	// prove if length of website has changed
	if (localStorage[url]>0 && localStorage[url] != data.length){
		console.log("Update @:  "+url);
		equals[url]=data.length;
		updateFE();
	}else if(!localStorage[url]){
		console.log("First time fetched: " + url);
		localStorage[url] = data.length;
	}else{
		console.log("Lastmodified or data size did not change since last check: " + url);
	}
}

  
function updateFE(){
	//updates the frontend (2 divs: pfinfo, pfdetail)

	length=Object.keys(equals).length
	if(length==0){
		$("#pfinfo").text("No Updates available!").off('click');
		$("#pfdetail").html("");
		$("#pfdetail").slideUp();
		$('#ticker').removeClass("pointer");
	}else if(length>0){
		chrome.extension.sendRequest({}, function(response) {});
		$('#ticker').addClass("pointer");
		var s='';
		if (length==1){
			$("#pfinfo").text("One Update available!").click(function(){$('#pfdetail').slideDown()});
		}else{
			$("#pfinfo").text(length+" Updates available!");		
			s='s';
		}
		var pfdetail='<h3>'+length+' Update'+s+' available</h3>';
		var i=0;
		$.each(equals, function(key,value){
			i++;
			pfdetail += '<ul><li><a target="_blank" href="' + key + '">' + key + '</a> <a id="d' + i + '" class="dismiss" href="#">(dismiss)</a></li></ul>';
			$( "body" ).on( "click","#d"+i,function(){dismiss(key,value);});
		});
		$("#pfdetail").html(pfdetail);
		$("#pfinfo").effect("shake","left",5,2);
	}

}

function dismiss(url,newlength){
	// updates localstorage to new data length
	// removes url of equals dictionary

	localStorage[url] = newlength;
	delete equals[url];
	console.log("url removed: " + url);
	updateFE();
}


function url_domain(data) {
	//returns domain name of an URL
	
	var    a      = document.createElement('a');
	a.href = data;
	return a.hostname;
}


