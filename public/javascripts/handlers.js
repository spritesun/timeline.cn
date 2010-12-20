if (!MemoLane) {
  var MemoLane = {};
}

MemoLane.lastStoryId = 0;

MemoLane.addLinks = function(text, elide) {
  
  if( !text )
    return "";
    
  //text = MemoLane.escape(text);
  //we need to ignore anything that might be an embedded anything (image, ...)
  var urls = text.match(/([^'"]\bhttp:\/\/\S+)/g);

  if( !urls )
     return text;
  
  var newText;
  $.each(urls, function(i, url) {
    var linkName = url;
    if( elide != 0 )
      linkName = MemoLane.elide( linkName, elide );
      
    newText = text.replace(url, "<a target=\"_blank\" href=\"" + url + "\">" + linkName +"</a>");
  });
  
  return newText;
};

MemoLane.nl2br = function(s) {
  s = String(s === null ? "" : s);
  return s.replace(/\n/g, "<br />");
};

MemoLane.resizeImageUrl = function(url, width, height) {
  //return "http://127.0.0.1:8080/?image=" + url + "&width=" + width + "&height=" + height;
  return "http://" + MemoLane.image8 + "/resize/" + width + "x" + height + "/" + url;
};

MemoLane.maxImageUrl = function(url, width, height) {
  //return "http://127.0.0.1:8080/?image=" + url + "&width=" + width + "&height=" + height;
  return "http://" + MemoLane.image8 + "/max/" + width + "x" + height + "/" + url;
};

MemoLane.cropImageUrl = function(url, width, height) {
  //return "http://127.0.0.1:8080/?image=" + url + "&width=" + width + "&height=" + height;
  return "http://" + MemoLane.image8 + "/crop/" + width + "x" + height + "/" + url;
};

MemoLane.largeImageUrl = function(url) {
  var viewportSize = $('.viewport:first').height() - 100;
  return MemoLane.maxImageUrl(url, 500, viewportSize);
};

MemoLane.largeGalleryImageUrl = function(url) {
  var viewportSize = $('.viewport:first').height() - 200;
  return MemoLane.maxImageUrl(url, 500, viewportSize);
};

MemoLane.smallImageUrl = function(url) {
  return MemoLane.resizeImageUrl(url, 145, 300);
};

MemoLane.thumbnailImageUrl = function(url) {
  return MemoLane.resizeImageUrl(url, 500, 64);
};

//these are simple templates for the atomic parts that can make up a memo
MemoLane.type_templates = {
  
  "title": {  //todo, add thumbnail if present!  
    //"small": "<p>{{#title}} {{{text}}} {{/title}}</p>",
    "small": "{{#title}}{{#thumbnail}}<img src='{{{thumbnail}}}' align='left' style='margin-right:8px;margin-bottom:4px' />{{/thumbnail}}<p>{{{text}}}</p>{{/title}}",
    "large": "<label>{{#title}} {{{text}}} {{/title}}</label>"
  },
  "category": {  //todo, add thumbnail if present!  
    "small": "<label>{{#category}} {{{text}}} {{/category}}</label>",
    //"small": "<img src='{{#title}} {{{thumbnail}}} {{/title}}' align='left' style='margin-right:8px;margin-bottom:4px' /><p>{{#title}} {{{text}}} {{/title}}</p>",
    "large": "<label>{{#category}} {{{text}}} {{/category}}</label>"
  },
  "description" : {
    "small": "<div class='description_preview'></div>",  //is previewing this a good idea?
    "large": "<div>{{#description}} {{{text}}} {{/description}}</div>"
  },
  "author": {  //todo, add thumbnail if present!  
    "small": "{{#author}}<label> {{#url}}<a href='{{{url}}}' target='_blank'>{{/url}} {{{name}} {{#url}}</a>{{/url}}</label>{{/author}}",
    //"small": "<img src='{{#title}} {{{thumbnail}}} {{/title}}' align='left' style='margin-right:8px;margin-bottom:4px' /><p>{{#title}} {{{text}}} {{/title}}</p>",
    "large": "{{#author}}<label> {{#url}}<a href='{{{url}}}' target='_blank'>{{/url}} {{{name}} {{#url}}</a>{{/url}}</label>{{/author}}"
  },
  "text": { 
    "small": "<div class='text_preview'/>",
    "large": "<div>{{#text}} {{{text}}} {{/text}}</div>"
  },
  "link": {
    "small": "{{#link}}<a href='{{{url}}}'>{{{name}}}</a>{{/link}}",
    "large": "{{#link}}<a href='{{{url}}}'>{{{name}}}</a>{{/link}}"
  },
  "image": {
    "small": "{{#image}} <img src=\"{{{thumbnail}}} \"/>{{/image}}",
    "large": "{{#image}} <img src=\"{{{url}}}\"/> {{/image}}",
    "thumbnail": "<img src=\"{{{thumbnail}}}\"></img>"
  },
  "video": {
    "small": "<img src=\"{{#video}} {{{thumbnail}}} {{/video}}\"/>",
    "large": "{{#video}} {{{video_player}}} {{/video}}",
    "thumbnail": "<img src=\"{{{thumbnail}}}\"></img>"
  },
  "geo": {
    "small": "<img src=\"{{{small}}}\"/>",
    "small-alt": "<div class='geo_canvas' style='width: 145px; height: 120px;'></div>",
    "large": "<div class='geo_canvas' style='width: 500px; height: 300px;'></div>"
  },
  "event": {
    "small": "<label>{{#event}} {{{location}}} {{/event}}</label>",
    "large": "<label>{{#event}} {{{location}}} {{/event}}</label>"
  },
  "track": {
    "small": "{{#track}}\
      <div class='music-small track'>\
        <div class='group'>\
          <img src='{{#artist}}{{{thumbnail}}}{{/artist}}' />\
            <ul class='artist-group'>\
              <li class='artist'>{{#artist}}{{{name}}}{{/artist}}</li>\
              <li>\
              <span class='track-name'>{{{name}}}</span>\
              <span class='track-count'>{{{playcount}}}</span>\
              </li>\
              {{#other_artists}}\
              <li>\
                <span class='other-artists'>+{{{count}}} other artist{{{plural}}}</span>\
              </li>\
             {{/other_artists}}\
          </ul>\
        </div>\
      </div>\
      {{/track}}",
    "large": "<div class='music-expanded trackchart'></div>",
    
    "chart-artist": "<div class='group'>\
      <img src='{{{thumbnail}}}' />\
        <ul class='artist-group track_list'>\
            <li class='artist'>{{{name}}}</li> \
        </ul>\
    </div>",
    
   "chart-track": "<li>\
      <a class='music-play-btn' href='#'>Play</a>\
      <span class='track-name'>{{{name}}}</span>\
      <span class='track-count'>{{{playcount}}}</span>\
      <span class='loading-track'>Finding song...</span>\
    </li>"
  }
}

MemoLane.templates = {
  "twitter": {
    "small": "{{#author}}<div><b>From {{{author}}}: </b> </div>{{/author}}<d>{{{title}}}</p>{{{image}}}",
    "large": "{{#author}}<div><b>From {{{author}}}: </b> </div>{{/author}}<p class='large-twitter'>{{{title}}}</p>{{{image}}}"
  },
  "foursquare": {
    "small": "<div>{{{title}}}<div>{{{geo}}}</div></div>",
    "large": "<div>{{{title}}}<div>{{{geo}}}</div></div>",
    "small-group": "<div><label>{{{count}}} checkins</label>{{{geo}}}</div>",
    "large-group": "<div><label>{{{count}}} checkins</label>{{{geo}}}</div>"
  },
  "tripit": {
    "small": "<div>{{{title}}}<div>{{{geo}}}</div></div>",
    "large": "<div>{{{title}}}<div>{{{geo}}}</div></div>",
    "small-group": "<div><label>{{{count}}} flights</label>{{{geo}}}</div>",
    "large-group": "<div><label>{{{count}}} flights</label>{{{geo}}}</div>"
  },
  "picasa": {
    "small": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{title}}}<div>{{{image}}}</div><div>{{{description}}}</div></div>",
    "small-group": "<div>{{{image}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div>{{#title}}<div>{{{title}}}</div>{{/title}}</div>"
  },
  "facebook-link": {
    "small": "<div>{{{title}}}</div><br><div>{{{link}}}</div>",
    "large": "<div>{{{title}}}</div><br><div>{{{link}}}</div>"
  },
  "facebook-event": {
    "small": "<div><b>{{{title}}}</b></div><div>@ <i>{{{event}}}</i></div>",
    "large": "<div><b>{{{title}}}</b></div><div>@ <i>{{{event}}}</i></div><br><div>{{{text}}}</div>"
  },
  "facebook-status": {
    "small": "{{{title}}}",
    "large": "{{{title}}}"
  },
  "facebook-photo": {
    "small": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "small-group": "<div>{{{image}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div>{{#title}}<div>{{{title}}}</div>{{/title}}</div>"
  }, 
  "facebook-note": {
    "small": "<div><h4>{{{title}}}</h4><div>{{{text}}}</div></div>",
    "large": "<div><h4>{{{title}}}</h4><div>{{{text}}}</div></div>"
  },
  "facebook-video": {
    "small": "<div>{{{video}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{title}}}<div>{{{video}}}</div><div>{{{description}}}</div></div>",
    "small-group": "<div>{{{video}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div><div>{{{title}}}</div></div>"
  },
  "flickr-image": {
    "small": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{title}}}<div>{{{image}}}</div><div>{{{description}}}</div></div>",
    "small-group": "<div>{{{image}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div>{{#title}}<div>{{{title}}}</div>{{/title}}</div>"
  }, 
  "flickr-video": {
    "small": "<div>{{{video}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{title}}}<div>{{{video}}}</div><div>{{{description}}}</div></div>",
    "small-group": "<div>{{{video}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div>{{#title}}<div>{{{title}}}</div>{{/title}}</div>"
  },
  "feed": {
    "small": "<div><h4>{{{title}}}</h4>{{{text}}}<div>{{#author}}by {{{author}}} {{/author}}from '{{{category}}}'</div></div>",
    "large": "<div><h4>{{{title}}}</h4><div>{{{text}}}</div></div>"
  },
  "lastfm": {
    "small":  "{{{track}}}",
    "large":  "{{{track}}}",
    "small-group": "{{{track}}}",
    "large-group": "{{{track}}}"
  },
  "photobucket": {
    "small": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{title}}}<div>{{{image}}}</div><div>{{{description}}}</div></div>",
    "small-group": "<div>{{{image}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div>{{#title}}<div>{{{title}}}</div>{{/title}}</div>"
  },
  "youtube": {
    "small": "<div>{{{title}}}</div><div>{{{video}}}</div><div>{{#author}}by {{{author}}} {{/author}}</div>",
    "large": "<div>{{{title}}}<div>{{{video}}}</div><div>{{{description}}}</div><div>{{#author}}by {{{author}}} {{/author}}</div></div>"
  },
  "myspace-mood": {
    "small": "{{{title}}}",
    "large": "{{{title}}}"
  },
  "myspace-photo": {
    "small": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "large": "<div>{{{image}}}</div><div>{{{title}}}</div>",
    "small-group": "<div>{{{image}}}</div></div><div>{{{title}}}",
    "large-group": "<div><div class=\"frame\"/><div class=\"viewport\"><div class=\"thumbnails\"/></div>{{#title}}<div>{{{title}}}</div>{{/title}}</div>"
  }, 
  "gallery_photo": {  //private template used for creating images in galleries
    "large": "<div>{{{image}}}</div><div>{{{description}}}</div><div>{{{title}}}</div>"
  },
  "gallery_video": {   //private template used for creating videos in galleries
    "large": "<div>{{{video}}}</div><div>{{{description}}}</div><div>{{{title}}}</div>"
  }
}



MemoLane.memoHandler = function(parent, data, inStory, storyId, editMode, contributor) {

  var small = MemoLane.buildMemo(parent, data, "small", inStory, storyId, editMode, contributor);
  small.hide();
  small.show();
  var large = null;
  parent.bind('expand', function() {
    
    small.hide();
    if (!large) {
      large = MemoLane.buildMemo(parent, data, "large", inStory, storyId, editMode, contributor);
    } else {
      large.show();
    }
    var $this = $(this);
    var $frame = $this.find('.frame');
    var $frameImg = $this.find('.frame img');
    if($frame.length > 0){
        $frameImg.load(function(){$frame.css('min-height',($frameImg.height()+20)+'px')});
    };
    
  });
  parent.bind('collapse', function() {
    large.remove();
    large = null;//ugly hack to get expand to always build a new memo (resize reason)
    small.show();
  });
}


MemoLane.buildMemo = function( parent, data, size, inStory, storyId, editMode, contributor ) {
  
  //handle single and multiple items in a consistent way
  var groupPostfix = "";
  var ids = [];
  
  //we get the first item in the list and use it to check which types we need to render
  var firstItem = {};
  
  //create a hash of the rendered content types in this data item
  var displayData = {};
  
  if( data.items != undefined ) {
    firstItem = data.items[0];
    groupPostfix = "-group";
    displayData["count"] = data.count;
    parent.closest('.memo').addClass('photo-stack');
    if(parent.find('.effect').length == 0){
      parent.append($('<div class="effect first"/>'));
      parent.append($('<div class="effect second"/>'));
    }
    
    if( editMode ) {
      $.each( data.items, function(i, memo) {
        ids.push( encodeURIComponent( memo._id ) );
      });
    }
  } else {
    firstItem = data;
    displayData["count"] = 1;
    if( editMode ) {
      ids.push( encodeURIComponent( data._id ) );
    }
  }
  
  //first get the type of the data as this is what everything else is based on
  type = firstItem.service;
  if( firstItem.sub_type )
     type += ("-" + firstItem.sub_type);
  
  //for some reason the js version of mustache really does not like you inserting 
  //templates into templates... it messes up horribly! Hence the somewhat more bulky
  //code here!
  
  //do any needed processing of the various types of data
  if( data.title ) {
    var processedTitle = { "title": {"text": data.title.text} };
    processedTitle["title"]["text"] = MemoLane.addLinks( data["title"]["text"], size == "small" ? 25 : 90 );
    if( data["title"]["thumbnail"] && data.service == "myspace" )  //for now, only how this for myspace as it is overkill in twitter and elsewhere
      processedTitle["title"]["thumbnail"] = data["title"]["thumbnail"];
  
    displayData["title"] = Mustache.to_html( MemoLane.type_templates["title"][size], processedTitle ); 
  }
  
  if( firstItem.author && firstItem.author.name ) {
    displayData["author"] = Mustache.to_html( MemoLane.type_templates["author"][size], firstItem );
  }
  
  if( firstItem.track ) {
    var t = firstItem.track;
    
    //count the artists
    var artistCount = 0;
    var artistHash = [];
    var tracks;
    
    if( data.items )
      tracks = data.items;
    else
      tracks = [data];
      
    $.each( tracks, function(i, memo) {
      var track = memo.track;
      var artistKey = track.artist.id;
      if( !artistHash[artistKey] ) {
        artistHash[artistKey] = 1;
        artistCount = artistCount + 1;
      }
    });
    
    var processedTrack = { "track": { "name": t.name, "id": t.id, "url": t.url, "playcount": t.playcount} };
    
    if( artistCount > 1 )
      processedTrack["track"]["other_artists"] = { "count": artistCount - 1, "plural": artistCount > 2 ? "s" : "" };
      
    processedTrack["track"]["artist"] = { "name": t.artist.name, "id": t.artist.id, "url": t.artist.url };
    
    if( t.artist.thumbnail && t.artist.thumbnail != "" )
      processedTrack["track"]["artist"]["thumbnail"] = MemoLane.cropImageUrl( t.artist.thumbnail, 50, 50 ); 
    else
      processedTrack["track"]["artist"]["thumbnail"] = MemoLane.cropImageUrl( "http://" + window.location.hostname + "/images/no-profile-image.png", 50, 50 );
    
    displayData["track"] = Mustache.to_html( MemoLane.type_templates["track"][size], processedTrack ); 
  }
  
  if( firstItem.text ) {
    var processedText = { "text": {} };
    processedText["text"]["text"] =  MemoLane.addLinks( firstItem["text"]["text"], size == "small" ? 25 : 90 );
    displayData["text"] = Mustache.to_html( MemoLane.type_templates["text"][size], processedText ); 
  }
  
  if( firstItem.link ) {
    var processedLink = { "link": { "url": firstItem.link.url, "name": firstItem.link.name,"description": firstItem.link.description } };
    if( size == "small" ) {
      processedLink["link"]["name"] = MemoLane.elide( processedLink["link"]["name"], 25 ); 
    }
    displayData["link"] = Mustache.to_html( MemoLane.type_templates["link"][size], processedLink ); 
  }
    
  if( firstItem.category )
    displayData["category"] = Mustache.to_html( MemoLane.type_templates["category"][size], firstItem ); 
  
  if( firstItem.geo ) {
    if( size == "small" ) {
      var imageUrl = MemoLane.geoPreviewImage( data );
      if( imageUrl.length < 2000 )
         displayData["geo"] = Mustache.to_html( MemoLane.type_templates["geo"]["small"], {"small": imageUrl});
      else
         displayData["geo"] = Mustache.to_html( MemoLane.type_templates["geo"]["small-alt"], {});
    } else {
      displayData["geo"] = Mustache.to_html( MemoLane.type_templates["geo"][size], {});
    }
  }
  
  if( firstItem.image ) {
    var processedImage = { "image": { "group": {} } };
    if(data.service == 'gallery_photo'){
      processedImage["image"]["url"] = MemoLane.largeGalleryImageUrl( firstItem["image"]["url"] );
    }else{
      processedImage["image"]["url"] = MemoLane.largeImageUrl( firstItem["image"]["url"] );
    }
    processedImage["image"]["thumbnail"] = MemoLane.smallImageUrl( firstItem["image"]["thumbnail"] );
    displayData["image"] = Mustache.to_html( MemoLane.type_templates["image"][size], processedImage );
  }
  
  if( firstItem.video ) {
    var processedVideo = { "video": { "group": {} } };
    
    var player = firstItem["video"]["video_player"];
    
    player = player.replace(/__WIDTH__/g, "500");
    player = player.replace(/__HEIGHT__/g, "400");
    
    processedVideo["video"]["video_player"] = player;
    processedVideo["video"]["thumbnail"] = MemoLane.smallImageUrl( firstItem["video"]["thumbnail"] );
    displayData["video"] = Mustache.to_html( MemoLane.type_templates["video"][size], processedVideo );
  }
  
  if( firstItem.description ) {
    var processedDescription = { "description": firstItem.description };
    processedDescription["description"]["text"] = MemoLane.addLinks( firstItem["description"]["text"], size == "small" ? 25 : 90 );
    displayData["description"] = Mustache.to_html( MemoLane.type_templates["description"][size], processedDescription );
  }
  
  if( firstItem.event ) {
    displayData["event"] = Mustache.to_html( MemoLane.type_templates["event"][size], firstItem );
  }
  
  var template = "";

  if( firstItem.template ) //allow for embedded templates (testing only)
     template = firstItem.template[size + groupPostfix];
  else
     template = MemoLane.templates[type][size + groupPostfix];
  
  if( !template ) {
  if(console.log){
    console.log( "no template for memo " + firstItem["_id"]);
    console.log( "type: " + type + ", size: " + size + groupPostfix );
   }
  }
  
  if( !displayData ){
  if(console.log){
    console.log( "no display data for memo " + firstItem["_id"]);
    }
  }
  
  
  var html = Mustache.to_html(template, displayData);
  var memo = $(html);
  
  //run helper functions to generate more complex types of content
  if( firstItem.geo )
    memo = MemoLane.handleGeo( memo, data, size );
    
  if( firstItem.text && size == "small" )
    memo = MemoLane.generateHtmlPreview( memo, firstItem.text.text );
  else if( firstItem.text && size == "large" )
    memo = MemoLane.resizeEmbeddedMedia( memo );
   
  if( data.items && ( firstItem.image || firstItem.video ) && size == "large" ){
        memo = MemoLane.handleImageGallery( memo, data );
  }
    
  if( size == "large" && ( firstItem.video || firstItem.text ) )
    memo = MemoLane.resizeEmbeddedMedia( memo );
   
  if( firstItem.track ) {
    if( size == "small" )
      memo = MemoLane.handlePlayLinks( memo, firstItem.track.artist.name, firstItem.track.name );
    else
      memo = MemoLane.handleTrackChart( memo, data );
  }
    
    
  //make all links open in new window
  var links = memo.find("a");
  $.each( links, function(i, link) {
    $(link).attr("target", "_blank");
  });
    
  //make all links clickable
  links.mousedown(function() { return false; });
  links.mouseup(function() { return false; });
  
  if( editMode ) {
  
    $.data( memo, "ids", ids );
    
    //add the "add to story button
    if( inStory ) {
      parent.addClass( "glow-in-story " );
      var removeHtml = "<a class='add-remove' title='Remove from Story'><img src='/images/stories/remove_memo.png' /></a>";
      var removeButton = $(removeHtml);
      
      
      removeButton.mousedown(function() { return false; });
      removeButton.mouseup(function() { return false; });
      removeButton.click(function() {
          var params = "ids=" + JSON.stringify(ids);
          var url = "/stories/" + storyId + "/memos";
          var xmlHttp = new XMLHttpRequest(); //returns a XMLHttpRequest object  
          var mimeType = "application/json";    
          xmlHttp.open('delete', url, false);  // true : asynchrone false: synchrone  
          xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');    
          xmlHttp.send(params);
          
          //reload knowing that we removed it from the story
          parent.empty()
          parent.removeClass( "glow-in-story " );
          MemoLane.memoHandler( parent, data, false, storyId, editMode );

      });
      
      parent.append( removeButton ); 
    } else {
      var addHtml = "<a class='add-remove' title='Add to Story'><img src='/images/stories/add_memo.png' /></a>";
      var addButton = $(addHtml);

      addButton.mousedown(function() { return false; });
      addButton.mouseup(function() { return false; });
      addButton.click(function() {
        var params = "ids=" + JSON.stringify(ids);
        var url = "/stories/" + storyId + "/memos";
        var xmlHttp = new XMLHttpRequest(); //returns a XMLHttpRequest object  
        var mimeType = "application/json";    
        xmlHttp.open('POST', url, false);  // true : asynchrone false: synchrone  
        xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');    
        xmlHttp.send(params);
        
        //reload knowing that we added it to the story
        parent.empty()
        MemoLane.memoHandler( parent, data, true, storyId, editMode );
      });
      
      parent.append( addButton );
    }
  } else if (inStory) {
    var avatarImage = "http://" + MemoLane.image8 + "/resize/28x28/http://" + window.location.hostname + "/" + contributor.username + "/image";
    var avatarHtml = "<a class='contributor' title='" + contributor.first_name + " " + contributor.last_name + "' href='/" + contributor.username + "#t=" + firstItem.created_at  + "' style='background-image:url("+avatarImage+")'></a>";
    var avatarObject = $(avatarHtml);
    parent.append( avatarObject );
  }
  
  parent.append( memo );

  return memo;
}



MemoLane.handleTrackChart = function( memo, data ) {

  var chart = memo.find(".trackchart");
  
  //so... first we group tracks by artist
  var artistHash = {};
  var artistPlays = {};
  
  //hack if there is only 1 track for the week
  if( !data.items )
    data.items = [data];
  
  $.each( data.items, function(i, memo) {
    var track = memo.track;
    var artistKey = track.artist.id;
    
    if( !artistHash[artistKey] ) {
      artistHash[artistKey] = [];
      artistPlays[artistKey] = track.artist.playcount;
    }
      
    artistHash[artistKey].push( track ); 
  });
  
  //now we find the 3 artists with the most plays...
  var sortetPlays = [];
  for (i in artistPlays) sortetPlays.push({v:i,c:artistPlays[i]})
  sortetPlays.sort(function(x,y){return y.c-x.c})

  
  var count = Math.min( sortetPlays.length, 4 );
  var artistsHtml = "<ul>";
  for ( var i = 0; i<count; i++ ) {
    var artistKey = sortetPlays[i].v;
    var artistCount = sortetPlays[i].c;
    
    var artistTracks = artistHash[artistKey].slice(0, 4);
    var artistName = artistTracks[0].artist.name;
    
    var artistThumbnail = "";
    if( artistTracks[0].artist.thumbnail != "" )
      artistThumbnail = MemoLane.cropImageUrl( artistTracks[0].artist.thumbnail, 80, 80 );
    else {
      artistThumbnail = MemoLane.cropImageUrl( "http://" + window.location.hostname + "/images/no-profile-image.png", 80, 80 );
    }
      
    //tracks should already be sorted from the grouping function in application.js and our
    //splitting it into artists should not break this! :-)
    var artistHtml = Mustache.to_html( MemoLane.type_templates["track"]["chart-artist"], { "name": artistName, "playcount": artistCount, "thumbnail": artistThumbnail } );
    var artistObject = $(artistHtml);
    
    var trackList = artistObject.find("ul.track_list");
    
    //create each of the track objects
    $.each( artistTracks, function(i, track) {
      var trackHtml = Mustache.to_html( MemoLane.type_templates["track"]["chart-track"], {"url": track.url , "name": MemoLane.elide( track.name, 60 ), "playcount": track.playcount} );
      var trackObject = $(trackHtml);
 
      trackObject = MemoLane.handlePlayLinks( trackObject, track.artist.name, track.name );
      trackList.append( trackObject );
      
      
    });
    
    memo.append( artistObject );
     
  }
   
  return memo;
}

MemoLane.handlePlayLinks = function( object, artist, track ) {
  var spotify = object.find("a.music-play-btn");
  spotify.mousedown(function() { return false; });
  spotify.mouseup(function() { return false; });
  spotify.click( function() {

    
    var trackName = object.find(".track-name");
    var trackCount = object.find(".track-count");
    var trackLoading = object.find(".loading-track");
    
    trackName.hide();
    trackCount.hide();
    trackLoading.show();
    $.ajax({
      url: MemoLane.currentUser.music_provider == "spotify" ? "/utils/spotify_url" : "/utils/amazon_url",
      data: {artist: artist, track: track},
      dataType: 'plain',
      username: MemoLane.username,
      password: MemoLane.password,
      success: function(data) {
        trackName.show();
        trackCount.show();
        trackLoading.hide(); 
        
        if (data != "\"\"") {
          if( MemoLane.currentUser.music_provider == "spotify" ) {
            window.location.href = data;
          } else {
            window.open( data, "amazon" );
          }
        } else {
        }
      }
    });
    return false;
  });
  
  return object;
}

MemoLane.handleImageGallery = function( memo, data ) {

  var thumbnails = memo.find(".thumbnails");
  var frame = memo.find(".frame");
  
  thumbnails.hide();//hide until all images are loaded
  
  //we create a dummy image that only contains image and title (if any) stuff and use 
  //recursion to render the individual memos
  
  var dummyMemo = {};
  if( data.items[0].image ) {
    dummyMemo = { "service" : "gallery_photo",
                  "title": data.items[0].title,
                  "image": data.items[0].image }
  } else if( data.items[0].video ) {
      dummyMemo = { "service" : "gallery_video",
                  "title": data.items[0].title,
                  "video": data.items[0].video }
  }
                     
  MemoLane.buildMemo( frame, dummyMemo, "large", "", false );
  
  $.each( data.items, function(i, memo) {
    var service = memo.service;

      var thumbnail = $('<div />');
   
      //we also handle video thumbnails
      if( memo.image ) {
        var thumbnailTemplate = MemoLane.type_templates["image"]["thumbnail"];
        var html = Mustache.to_html( thumbnailTemplate, { "thumbnail": MemoLane.thumbnailImageUrl( memo.image.thumbnail ) } );
        thumbnail.append($(html));
      } else if( memo.video ) {
        var thumbnailTemplate = MemoLane.type_templates["video"]["thumbnail"];
        var html = Mustache.to_html( thumbnailTemplate, { "thumbnail": MemoLane.thumbnailImageUrl( memo.video.thumbnail ) } );
        thumbnail.append($(html));
      }
       
      thumbnail.bind('safeclick', function() {
        frame.empty();
        var dummyMemo = {};
        if( memo.image ) {
          dummyMemo = { "service" : "gallery_photo",
                        "title": memo.title,
                        "image": memo.image }
        } else if( memo.video ) {
          dummyMemo = { "service" : "gallery_video",
                        "title": memo.title,
                        "video": memo.video }
        }
                     
        MemoLane.buildMemo( frame, dummyMemo, "large", "", false );
      });
      thumbnails.append(thumbnail);
    
  });
  

  thumbnails.find('img').imagesLoaded(function(){

    $thumbScroller=thumbnails.parent();
    $thumbScroller_container=thumbnails;
    $thumbScroller_content=thumbnails.find('div');
    $thumbScroller_thumb=thumbnails.find('img');
    
    $thumbScroller_container.parent().css('background-image','none');
    $thumbScroller_container.show();


    var sliderWidth=$thumbScroller.width();//with of viewport 
    
    var totalContent = 0;

    $thumbScroller_content.each(function (i,el) {
        totalContent+=$(el).outerWidth();
    }); 
    
    if(totalContent > sliderWidth){
            $thumbScroller_container.css("width",totalContent);

    $thumbScroller.mousemove(function(e){

        var mouseCoords=(e.pageX - $(this).parents('.content').offset().left-10);
        var mousePercentx=mouseCoords/sliderWidth;

        var destx=-(((totalContent-sliderWidth)-sliderWidth)*(mousePercentx));

        var thePosA=mouseCoords-destx;
        var thePosB=destx-mouseCoords;
        

        if(mouseCoords==destx){
            $thumbScroller_container.stop();
        }
        if(mouseCoords>destx){
            $thumbScroller_container.css("left",-thePosA);
        }
        if(mouseCoords<destx){
            $thumbScroller_container.css("left",thePosB);
        }
        
    });
    
    }
    
        $thumbScroller_thumb.hover(
        function(){ //mouse over
            $(this).css('border','2px solid #000');
        },
        function(){ //mouse out
            $(this).css('border','2px solid #fff');
        }
    );
    
  });

new MemoLane.ThumbnailsScroll(thumbnails);
  
  return memo;
};


MemoLane.geoPreviewImage = function( data ) {

  //handle single and multiple items in a consistent way
  items = new Array();
  if( data.items != undefined ) {
    items = data.items;
  } else {
    items.push(data);
  }
  
  var poiCount = 0;
  var polyCount = 0;

  //handle polylines
  var polyLineList = "&path=color:blue|";
  $.each(items, function(i, memo) {
      if( memo.geo.polyline ) {
        $.each(memo.geo.polyline, function(i, point) {
          polyLineList += (point.lat + "," + point.lon + "|");
          polyCount++;
        });
      }
  });
  polyLineList = polyLineList.slice(0, -1)
  
  //handle markers
  var markerList = "&markers=color:red|";
  $.each(items, function(i, memo) {
      if( memo.geo.poi ) {
        $.each(memo.geo.poi, function(i, point) {
          markerList += (point.lat + "," + point.lon + "|");
          poiCount++;
        });
      }
  });
  markerList = markerList.slice(0, -1)
  
  //if we have multiple points, google maps will automatically specify a sane zoom level
  //but if we only have a single point, we need to specify it manually
  var zoom = "";
  if( polyCount == 0 && poiCount == 1 )
    zoom = "&zoom=14"
  
  return "http://maps.google.com/maps/api/staticmap?size=" + 145 + "x" + 120 + zoom + "&sensor=false" + polyLineList + markerList + "&maptype=roadmap"
}


MemoLane.handleGeo = function( memo, data, size ) {

  var geoObjects = memo.find('.geo_canvas');
  _.each(geoObjects, function(geo) {  //there really should be only one
  
    
    //FIXME (or just wait until it is superseeded by the new js framework anyway...)
    if( $(geo).css("width") != "145px" ) {
      memo.mousedown(function() { return false; });
      memo.mouseup(function() { return false; });
      memo.mousemove(function() { return false; });
    }
   
    //handle single and multiple items in a consistent way
    var items = new Array();
    if( data.items != undefined ) {
      items = data.items;
    } else {
      items.push(data);
    }
 
    //get a position to use as the inital center
    //we cannot just use 0,0 as that screws up the bounds calculation

    var firstItem = items[0];
    
    var initialLat = 0.0;
    var initialLon = 0.0;
    
    if( firstItem.geo.poi ) {
      initialLat = firstItem.geo.poi[0].lat;
      initialLon = firstItem.geo.poi[0].lon;
    } else if ( firstItem.geo.polyline ) {
      initialLat = firstItem.geo.polyline[0].lat;
      initialLon = firstItem.geo.polyline[0].lon;
    }
    
    var latlng = new google.maps.LatLng(initialLat, initialLon);
    var myOptions = {
      zoom: 15,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    if( $(geo).css("width") == "145px" ) {
      myOptions["disableDefaultUI"] = true;
      myOptions["mapTypeControl"] = false;
      myOptions["draggable"] = false;
      myOptions["scrollwheel"] = false;
    }

    var map = new google.maps.Map(geo,myOptions);
    
    //first handle polyline
    var latlngs = [];
    var boundsList = [];
    $.each(items, function(i, memo) {
        if( memo.geo.polyline ) {
          $.each(memo.geo.polyline, function(i, point) {
            pos = new google.maps.LatLng( point.lat, point.lon );
            latlngs.push( pos );
            boundsList.push( pos );
          });
        }
    });
    
    
    var track = new google.maps.Polyline({
      path: latlngs,
      strokeColor: "0000FF",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    
    track.setMap(map);
    //then handle POIs
    
    //we need to pre proccess the list of POI's to see if any should be merged
    var poiHash = {};
    $.each(items, function(i, memo) {
      if( memo.geo.poi ) {
        $.each(memo.geo.poi, function(i, poi) {
          var key = poi.name + "-" + poi.lat + "-" + poi.lon;
          if( !poiHash[key] )
            poiHash[key] = [];
     
          poiHash[key].push( poi ) 
        });
      }
    }); 
    
    //flatten  (we need to do this seperately or we run into some very strange scope issues)
    var mergedPois = [];
    for( var key in poiHash ) {
        mergedPois.push( poiHash[key] );
    }
    
  
    $.each(mergedPois, function(i, poiList) {
      var firstPoi = poiList[0];

      var infoWindowHtml = '<b>' + firstPoi.name+ '</b><br/>'

      $.each(poiList, function(i, poi) {
        var date = new Date(poi.time * 1000);
        if( poi.description )
          infoWindowHtml += "" + poi.description + "<br>"
        infoWindowHtml += "" + date.toString() + "<br>"
      });
      
      infoWindowHtml = infoWindowHtml.slice(0, -8)

      var latlng = new google.maps.LatLng(firstPoi.lat,firstPoi.lon);
      boundsList.push(latlng);
      
      var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: firstPoi.name
      });

      // create the tooltip and its text
      var infoWindow = new google.maps.InfoWindow();

      // add a listener to open the tooltip when a user clicks on one of the markers
      google.maps.event.addListener(marker, 'click', function() {
        infoWindow.setContent(infoWindowHtml);
        infoWindow.open(map, marker);
      });
          
    });

    //make the map set bounds so all markers are shown
    //but we need to wait untill the map tiles are fully loaded
    //or it will fail
    var madeToFit = false;
    google.maps.event.addListener(map, 'tilesloaded', function () {
      if( !madeToFit ) {
        google.maps.event.trigger(map, 'resize');
        madeToFit = true;
        $.each(boundsList, function(i, point) {
          map.getBounds().extend(point);
        });
        map.fitBounds( map.getBounds() );
      }
    }); 

  });
  
  return memo;
}

MemoLane.expandHandler = function(parent) {
  parent.trigger('expand');
};

MemoLane.collapseHandler = function(parent) {
  parent.trigger('collapse');
};

MemoLane.memoHandlers = {
    small: MemoLane.memoHandler,
    expand: MemoLane.expandHandler,
    collapse: MemoLane.collapseHandler,
};

if (!MemoLane.Feed) {
  MemoLane.Feed = {};
}

MemoLane.Feed.Handlers = {
  friendship: function(data) {
    var template = [
      "{{#friend}}",
        "<a href='/{{username}}'>",
          "{{username}} ({{first_name}} {{last_name}})",
        "</a>",
      "{{/friend}}",
      "and",
      "{{#other}}",
        "<a href='/{{username}}'>",
          "{{username}} ({{first_name}} {{last_name}})",
        "</a>",
      "{{/other}}",
      "are now friends."
    ].join('\n');
    var html = Mustache.to_html(template, data);
    return html;
  },
  friendship_request_accepted: function(data) {
    var template = [
      "{{#friend}}",
        "<a href='/{{username}}'>",
          "{{username}} ({{first_name}} {{last_name}})",
        "</a>",
      "{{/friend}}",
      "accepted your friendship request."
    ].join('\n');
    t = template;
    var html = Mustache.to_html(template, data);
    return html;
  }
}

MemoLane.image8 = "image8.memolane.com";
//MemoLane.image8 = "dev.memolane.com:4008";

MemoLane.resizeEmbeddedMedia = function(object) {
  //resize images
  images = object.find("img");
   _.each(images, function(image) {
     image['src'] = "http://" + MemoLane.image8 + "/max/500x376/" + image['src'];
     if( image['width'] && image['width'] > 500 ) {
      if( image['height'] ) {
        scale_factor = 500.0 / image['width'];
        image['height'] = image['height'] * scale_factor;
      }
      image['width'] = 500;
    }
  })

  //fix up embedded youtube and vimeo videos
  movie_objects = object.find("object");
  _.each(movie_objects, function(movie_object) {
    //find the movie tag and check if this is indeed a youtube or vimeo movie
    movies = object.find("param[name=\"movie\"]");
    if( movies.length == 1 ) {
      movie = movies[0]
      url = movie['value'];

      //check if this object is indeed a youtube video
      if( url.match(/^http:\/\/(?:www\.)?youtube\.com\/v\//) || url.match(/^http:\/\/(?:www\.)?vimeo\.com\//) || url.match(/^http:\/\/(?:www\.)?facebook\.com\/v\//) ) {
        //now figure out the scaling factor so we can keep the aspect ratio
        width = movie_object['width'];
        height = movie_object['height'];

        scale_factor = 500.0 / width;
        new_width = width * scale_factor;
        new_height = height * scale_factor;

        //scale any width/height attributes that match the original sizes
        _.each(object.find("*[width]"), function(width_elem) {
          if( width_elem['width'] == width ) {
            width_elem['width'] = new_width;
          }
        })

        _.each(object.find("*[height]"), function(height_elem) {
          if( height_elem['height'] == height ) {
            height_elem['height'] = new_height;
          }
        })
      }
    }
  })

  return object;
}


//given a chunk of html, this function will try to figure out what can be shown as preview
//Currently, the rules are:
//
// 1. if there are embedded images, use the first one as preview
// 2. if we find an embedded video, show a small video icon/image
// 3. if no images or videos are found, use the first 100 letters of raw text
MemoLane.generateHtmlPreview = function(object, html) {

  var previews = object.find(".text_preview");
  if( previews.length == 0 )
    return object;
 
  var preview = object.find(".text_preview")[0];

  //smal hack.. wrap in a div, or we cannot search in it if it is, for instance
  //just a list of img tags
  var html_object = $("<div>" +  html + "</div>");

  var images = html_object.find("img");
  if( images.length > 0 ) {
    var image = images[0]
    var url = MemoLane.smallImageUrl( image['src'] );

    if(image['width'] > 80 && image['height'] > 80 ) {
       preview.innerHTML = "<img src=\"" + url + "\" />";
       return object;
    } else if( image['width'] == 0 && image['height'] == 0 ) {

      //no size tags in img tags, so actually fetch image to have a look...
      var newImg = new Image();
      newImg.src = image['src'];

      newImg.onload = function() {

        if( newImg.height > 80 && newImg.width > 80 ) {
          var text =  "<img src=\"" + url + "\" />";
          preview.innerHTML = text;
        } else {
          var text = "<blockquote style=\"padding : 3px; margin-left: 3px; background: #DDDDDD none; color: #000;\">" + MemoLane.textFromHtml( html, 100 );
          text += "...</blockquote>";
          preview.innerHTML = text;
        }

      }
      //wheter to show image or text is decided when the image has been loaded so we know its size
      return object;
    }
  }

  movies = html_object.find("object");
  if( movies.length > 0 ) {
    movie = movies[0]
    if(movie['width'] > 100 && movie['height'] > 100 || movie['width'] == 0 && movie['height'] == 0 ) {
      url = MemoLane.smallImageUrl( "http://" + window.location.hostname + "/images/video_icon.png" );
      var text = "<img src=\"" + url + "\" />";
      preview.innerHTML = text;
      return object;
    }
  }

  //no images or embedded objects... lets try to get a 100 or so chars of clean text
  var text = "<blockquote style=\"padding : 3px; margin-left: 3px; background: #DDDDDD none; color: #000;\">" + MemoLane.textFromHtml( html, 100 );
  text += "...</blockquote>"
  preview.innerHTML = text;
  return object;
}

MemoLane.textFromHtml = function(html, chars) {
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  full_text = tmp.textContent||tmp.innerText;
  return full_text.substring( 0, chars );
}

MemoLane.elide = function( text, max_length ) {
    var newText = text;
    if( newText && (newText.length > max_length)) { 
        newText = newText.substring(0, max_length - 4) + "...";
    }
    return newText;
}

MemoLane.escape = function(s) {
  s = String(s === null ? "" : s);
  return s.replace(/&(?!\w+;)|["<>\\]/g, function(s) {
    switch(s) {
    case "&": return "&amp;";
    case "\\": return "\\\\";
    case '"': return '\"';
    case "<": return "&lt;";
    case ">": return "&gt;";
    default: return s;
    }
  });
};