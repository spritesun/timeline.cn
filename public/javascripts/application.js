var MemoLane = {};

MemoLane.username = "d458a0ce02fbb7eafb4aa433d800022f";
MemoLane.password = "foo";
MemoLane.initialIndex = 0;

MemoLane.config = {
  memo: {
    large: {
      width: 550
    }
  }
};

MemoLane.today = function() {
  var d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

MemoLane.dateOffset = function(date, offset) {
  var ms = date.valueOf();
  return new Date(ms + offset * 86400000);
};

MemoLane.formatUTCDate = function(sec) {
  var d = new Date(sec * 1000);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toDateString();
};

MemoLane.BarLine = function(barline, fromTime, toTime, callback) {
  this.callback = callback;
  this.barline = barline;
  this.fromTime = fromTime;
  this.toTime = toTime;
  this.deltaSec = this.toTime - this.fromTime;
  this.calibrate();
  this.barlane = this.barline.find("div.barlane");
  this.date = this.barline.find("div.datelane div.date");
  this.marker = this.barlane.find("div.marker");
  this.marker.hide();
  this.bump = this.barlane.find("div.bump");
  this.bump.hide();

  var t = this;
  this.barlane.mouseenter(function(e) {
    var x = e.pageX;
    t.update(x);
    t.marker.show();
    t.bump.show();
    return false;
  });
  this.barlane.mousemove(function(e) {
    var x = e.pageX;
    t.update(x);
    return false;
  });
  this.barlane.mouseleave(function(e) {
    t.reset();
    t.marker.hide();
    t.bump.hide();
    return false;
  });
  this.barlane.click(function(e) {
    $('#viewport').css({'background-image':'url("/images/large-loading2.gif")',
                        'background-repeat':'no-repeat',
                        'background-position':'center center'});
                    
    //fake way to mark what we click on the barline
    $('.markerHere').css('left',e.pageX-1+'px');

    t.callback(t.secOfPoint(e.pageX));
    
  });
};

MemoLane.BarLine.prototype.secOfPoint = function(x) {
  return Math.ceil( ( ( x / this.length ) * this.deltaSec ) + this.fromTime );
};

MemoLane.BarLine.prototype.update = function(x) {
  var sec = this.secOfPoint(x);
  this.date.text(MemoLane.formatUTCDate(sec));
  var w = this.date.width();
  var offset = Math.max((x - Math.ceil(w / 2)), 5);
  offset = Math.min(offset, this.length - w - 5);
  this.date.css("left", offset + "px");
  this.marker.css("left", (x - 1) + "px");
  this.bump.css("left", (x - 60 - ((x + 3) % 7)) + "px");
};

MemoLane.BarLine.prototype.reset = function(x) {
  this.date.text("");
};

MemoLane.BarLine.prototype.calibrate = function() {
  this.length = this.barline.width();
};

MemoLane.TimeLine = function(timeline, list, makeUrl, memoHandlers) {
  this.timeline = timeline;
  this.list = list;
  this.makeUrl = makeUrl;
  this.memoHandlers = memoHandlers;
  this.viewport = timeline.parent();
  this.masterSlot = timeline.find("> div.slot");
  this.slotWidth = this.masterSlot.outerWidth();
  this.masterSlot.remove();
  this.slotCount = Math.ceil(9000 / this.slotWidth);
  this.preferredOffset = Math.ceil(this.slotCount / 3) * this.slotWidth - 5;
  this.slots = [];
  this.timeline.width(this.slotCount * this.slotWidth);
  this.slotsPerScreen = Math.floor(this.viewport.width() / this.slotWidth);
  this.memoProxy = new MemoLane.MemoProxy.Proxy($("#urls .memos").attr("href"));

  var t = this;
  
  var offset = Math.ceil(this.slotCount / 3) + Math.floor(this.viewport.width() / this.slotWidth);
  if( MemoLane.initialIndex != 0)
    offset = Math.floor( offset + MemoLane.initialIndex - (this.slotsPerScreen / 2 ) );
  
  
  this.fill(list.length - offset, function() {
    t.viewport.css('background','none');
    t.timeline.animate({opacity: 1.0}, 'fast');
  });

  this.down = false;
  var dragX = false;
  this.dragY = false;
  this.startX = null;
  this.startY = null;
  this.moveY = null;
  this.$leftEmptySlot = null;
  this.$rightEmptySlot = null;
  this.atRightEdge = null;
  this.atLeftEdge = null;
  this.atRightEdgeStop = null;
  this.atLeftEdgeStop = null;

  this.lock = false;

  var mousedown = function(x, y) {
    t.down = true;
    t.startX = x;
    t.startY = y;
    t.$rightEmptySlot = t.timeline.find('.slot:not(.empty):last').next();
    t.$leftEmptySlot = t.timeline.find('.slot:not(.empty):first').prev();
    t.atRightEdge = t.$rightEmptySlot.length;
    t.atLeftEdge = t.$leftEmptySlot.length;
    t.atRightEdgeStop = t.atRightEdge ? t.$rightEmptySlot.offset().left < t.viewport.width() : null;
    t.atLeftEdgeStop = t.atLeftEdge ? t.$leftEmptySlot.offset().left > 0 : null;
  };
  
  this.timeline.mousedown(function(e) {
    if(e.target.nodeName.toLowerCase() == "object" || e.target.nodeName.toLowerCase() == "embed"){
      return;
    }else{
      mousedown(e.pageX, e.pageY);
      return false;
    }
  });
  
  this.timeline.bind("touchstart", function(e) {
    mousedown(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY);
    return false;
  });
  
  var mousemove = function(x, y) {

    if (dragX) {
      var d = x - t.startX;
      
      //stop if at end of timeline right
      if(t.atRightEdge){
        if(t.atRightEdgeStop && d<0){
          t.down = false;
          dragX = false;        
        }else{
          t.timeline.css("left", (t.timelineX + d) + "px");
        }
      }else{
        t.timeline.css("left", (t.timelineX + d) + "px");
      }
      //stop if at end of timeline left
      if(t.atLeftEdge){
        if(t.atLeftEdgeStop && d>0){
          t.down = false;
          dragX = false;
        }else{
          t.timeline.css("left", (t.timelineX + d) + "px");
        }
      }else{
        t.timeline.css("left", (t.timelineX + d) + "px");
      }

    } else if (t.dragY) {
      if (t.moveY) t.moveY(y - t.startY);
    } else if (t.down) {
      var dx = (x - t.startX);
      var dy = (y - t.startY);
      var adx = Math.abs(dx);
      var ady = Math.abs(dy);
      if (ady > 5 && ady >= adx) {
        if (t.moveY) {
          t.dragY = true;
          t.moveY(dy);
        }
      } else if (adx > 5) {
        dragX = true;
        t.timeline.css("left", (t.timelineX + dx) + "px");
      }
    }
  };
  
  this.timeline.mousemove(function(e) {
    mousemove(e.pageX, e.pageY);
  });
  
  this.timeline.bind("touchmove", function(e) {
    var touches = e.originalEvent.changedTouches[0];
    mousemove(touches.pageX, touches.pageY);
  });
  
  var stopDragging = function(x,e) {
    if (dragX) {
        t.moveBarLineMark();
      var d = x - t.startX;
      t.timelineX += d;
      t.timeline.css("left", t.timelineX + "px");
      dragX = false;
      t.balance();
    }

    t.down = false;
    if(e.target.nodeName.toLowerCase() == "object" || e.target.nodeName.toLowerCase() == "embed"){
      return;
    }else{
      return false;
    }
  };
  
  var mouseuporleave = function(e) {
    return stopDragging(e.pageX,e);
  };
  
  this.timeline.mouseup(mouseuporleave);
  
  this.timeline.mouseleave(mouseuporleave);
  
  var touchendorcancel = function(e) {
    stopDragging(e.originalEvent.changedTouches[0].pageX);
  };
  
  this.timeline.bind("touchend", touchendorcancel);
  this.timeline.bind("touchcancel", touchendorcancel);
};

MemoLane.TimeLine.prototype.fill = function(offset, callback) {
  var t = this;
  this.timeline.empty();
  this.slots = [];
  var loadedSlots = 0;
  for (var i = 0; i < this.slotCount; i++) {
    var slot = this.makeSlot(offset + i, function() {
      loadedSlots++;
      if (loadedSlots == t.slotCount) {
        if (callback) {
            if($('#urls .story').attr('first_edit') == "true"){
                    $('<div id="newStoryHelp" class="jqmWindow jqmID1"><a class="closeModal" href="#">Close</a><ol><li class="addMemos">Select memos to add to a story by<br>clicking this icon:</li><li>When you are done adding memo\'s click<br/>"I\'m Done, View Story" in the green menu bar.</li></ol></div>')
                    .appendTo('body')
                    .find("a.closeModal").click( function() {$('#newStoryHelp').jqmHide();return false;})
                    .end()
                    .jqm({modal: true, trigger: false})
                    .jqmShow()
            }   
            callback();
        }
      }
    });
    this.slots.push(slot);
    this.timeline.append(slot.element);
  }
  
  this.timelineX = - this.preferredOffset;
  this.timeline.css("left", this.timelineX + "px");

};

MemoLane.TimeLine.prototype.jump = function(time) {
  var index = 0;
  for (; index < this.list.length; index++) {
    if (time < this.list[index].to) break;
  }
  
  var totalofAllSlots = this.list.length * this.slotWidth;
  
  var whereAreInTotalOfAllSlots = index * this.slotWidth;
  
  var foo = whereAreInTotalOfAllSlots/totalofAllSlots * $('.barlane').width();
  
  var t = this;
  this.timeline.animate({opacity: 0.0}, 'fast', function() {
    var offset = Math.floor($(window).width() / t.slotWidth / 2);
 
    t.fill(index - offset - Math.ceil(t.slotCount / 3), function() {
      t.viewport.css('background','none');
      t.timeline.animate({opacity: 1.0}, 'fast');
      //t.moveBarLineMark();
    });
  });
};

MemoLane.TimeLine.prototype.getMemoHandler = function(service) {

  var handlers = this.memoHandlers;
  if (handlers) {
    return handlers.small;
  } else {
    return null;
  }
};

MemoLane.TimeLine.prototype.getExpandMemoHandler = function(service) {
  var handlers = this.memoHandlers;
  if (handlers) {
    return handlers.expand;
  } else {
    return null;
  }
};

MemoLane.TimeLine.prototype.getCollapseMemoHandler = function(service) {
  var handlers = this.memoHandlers;
  if (handlers) {
    return handlers.collapse;
  } else {
    return null;
  }
};

MemoLane.TimeLine.prototype.expandMemo = function(memo) {
  var content = memo.find("> .content");
  var service = content.data("service");
  var handler = this.getExpandMemoHandler(service);
  if (handler) {
    handler(content);
  }
};

MemoLane.TimeLine.prototype.collapseMemo = function(memo) {
  var content = memo.find("> .content");
  var service = content.data("service");
  var handler = this.getCollapseMemoHandler(service);
  if (handler) {
    handler(content);
  }
};

MemoLane.TimeLine.prototype.makeMemoContent = function(parent, service, data, inStory, storyId, editMode, contributor ) {
  var handler = this.getMemoHandler(service);
  if (handler) {
    handler(parent, data, inStory, storyId, editMode, contributor);
  } else {
    parent.text(service);
  }
};

MemoLane.TimeLine.prototype.makeMemo = function(parent, data, inStory, storyId, editMode, contributor) {
  var service = data.service;
  var memo = $("<div class=\"memo " + service + "\"/>");
  var connection = $("<div class=\"connection\"/>");
  var connect = $("<div class=\"connect\"/>");
  connection.append(connect);
  memo.append(connection);
  var content = $("<div class=\"content\"/>");
  content.data("service", service);
  memo.append(content);
  this.makeMemoContent(content, service, data, inStory, storyId, editMode, contributor);
  parent.append(memo);
};


MemoLane.TimeLine.prototype.makeStacks = function(rows) {

    var items = [];
    var groups = [];

    var groupHash = {}
    var ungroupedItems = [];
    var groupedItems = [];
    
    $.each(rows, function(i, item) {
    
      //create a key based on user, service and group ids
      var key = "";
      var groupTitle = "";
      
      if( item.group ) {
        key = item.user_id + ":" + item.service + ":" + item.group.id;
        groupTitle = item.group.name;
      }
            
      //todo add played tracks stuff
      if( !groupHash[key] ) {
        groupHash[key] = { "service": item.service, "items": [] };
        
        //only add title if we have a sane one.
        if( !(groupTitle == "no group" || groupTitle == "_NO_GROUP_" || groupTitle == "" ) ) {
          groupHash[key]["title"] = { "text": groupTitle }
        }
      }
        
      //if we do not have a key, add directly to list of ungrouped items
      if( key != "" ) {
        groupHash[key]["items"].push(item) ;
      }
      else
        ungroupedItems.push( item );
      
    });
    
    //do a quick sorting based on creation time
    function sortfunction(a, b){
      if( a.track && b.track && a.created_at == b.created_at )
        return b.track.playcount - a.track.playcount;  //TODO: make an explicit "weight" of memos to use when creation times match instead?
        
      return a.created_at - b.created_at;
    }
    
    for(var i in groupHash) {
      if( groupHash[i]["items"].length == 1 ) {
        ungroupedItems.push( groupHash[i]["items"][0] )
      } else if ( groupHash[i]["items"].length > 0 )  {
        var group = groupHash[i]
        group["count"] = group["items"].length;
        group["items"].sort(sortfunction);
        groupedItems.push( group );
      }
    }
   
    ungroupedItems.sort(sortfunction);
    
    groupedItems = groupedItems.concat(ungroupedItems);

    return groupedItems;
    
};


MemoLane.TimeLine.prototype.makeBody = function(item, body, data, callback) {
  var t = this;
  var items = this.makeStacks(data.memos);
    
  var storyId = $("#urls .story").attr("href")
  var editMode = $("#urls .story").attr("edit_mode") == "true";
  if (storyId != "") {
    //if we are in a editing a stort, get a list of id's 
    //so we can mark memos as part of the story
    var url = "/stories/" + storyId + "/memos";
    Gnarly.json(['get', [url, {from: item.from, to: item.to}], {}], function(xhr, result) {
      if (xhr.status === 200) {
        
        var ids = [];
        $.each(result.memos, function(i, memo) {
          if( memo )
            ids.push( memo._id );
        });
        
        //also get the story members
        Gnarly.json(['get', "/stories/" + storyId + "/members"], function(xhr, data) {
          if (xhr.status == 200) {
            var storyMembers = {};
            $.each( data, function(i, member) {
              storyMembers[member.id] = member;
            });
            
            $.each(items, function(i, e) {
              if( e.items )
                t.makeMemo(body, e, $.inArray(e.items[0]._id, ids) != -1, storyId, editMode, storyMembers[e.items[0].user_id] );
              else
                t.makeMemo(body, e, $.inArray(e._id, ids) != -1, storyId, editMode, storyMembers[e.user_id] );
            });
        
          } else {
            //TODO; something...
          }
          if (callback) { callback() };
        });
          
      } else {
    // ToDo: Error Handling
      }
    });
  } else {
    $.each(items, function(i, e) {
      t.makeMemo(body, e, false, "", false, {});
    });
    if (callback) { callback() };
  }

  
};

MemoLane.TimeLine.prototype.makeSlot = function(index, callback) {
  var slot = this.masterSlot.clone();
  var item = this.list[index];
  if (item) {
  
    //give each slot in the dom its date value
    slot.attr('id',item.from.toString()).addClass('notEmpty');
     
    var content = slot.find("> div.content");
    content.find("> div.head > div.date").text(MemoLane.formatUTCDate(item.from));
    var viewport = content.find("> div.viewport");
    var body = viewport.find("> div.body");
    var bodyY = 0;
    var t = this;
    var move = function(d) {
      if(Math.abs(bodyY-200)>body.height()){bodyY= -(body.height()-250);return;};   
      var y = Math.min(0, bodyY + d);
      body.css("top", y + "px");
    };
  
    viewport.bind('mousewheel', function(event,delta,deltaX,deltaY){
    if(body.height()<viewport.height()-40){return;};
    if(Math.abs(bodyY-200)>body.height()){bodyY= -(body.height()-250);return;};
        if(body.offset().top <= 146){       
            var y = Math.ceil(bodyY+(deltaY*30));
            if(y<0){
                bodyY = y;
                body.css("top", y + "px");
            }else{
                bodyY = 0;
                body.css("top", 0 + "px");
            }       
           return false;
        };
    });
    
    viewport.mousedown(function() {
    if(body.height()<viewport.height()-40){return};
      t.moveY = move;
    });
    viewport.bind("touchstart", function() {
      t.moveY = move;
    });
    var stopDragging = function(y) {
      if (t.dragY) {
        var d = y - t.startY;
        var y = Math.min(0, bodyY + d);
        bodyY = y;
        body.css("top", bodyY + "px");
        t.dragY = false;
      }
    };
    viewport.mouseleave(function(e) {
      if(Math.abs(bodyY-200)>body.height()){bodyY= -(body.height()-250);return;};
      stopDragging(e.pageY);
      t.down = false;
    });
    viewport.mouseup(function(e) {
      if(Math.abs(bodyY-200)>body.height()){bodyY= -(body.height()-250);return;};
      stopDragging(e.pageY);
    });
    viewport.bind("touchend", function(e) {
      stopDragging(e.originalEvent.changedTouches[0].pageY);
    });

    var expandMemo = function(memo) {
      if (memo.hasClass("expanded")) {
        var memos = memo.parent();
        var y = parseInt(memos.css("top"), 10);
        var z = memo.position().top;
        if (y < -z) {
          bodyY = -z;
          memos.animate({"top": bodyY});
        }
        collapseMemo(memo);
        t.expandedMemo = null;
      } else {
        var width = MemoLane.config.memo.large.width;
        if (t.expandedMemo) {
          collapseMemo(t.expandedMemo, function() {
            var content = memo.find("> .content");
            bodyY = -memo.position().top;
            body.animate({top: bodyY});
            memo.css({width: width});
            memo.addClass("expanded");
            t.expandMemo(memo);
            t.expandedMemo = memo;
          });
        }
        var content = memo.find("> .content");
        bodyY = -memo.position().top;
        body.animate({top: bodyY});
        memo.css({width: width});
        memo.addClass("expanded");
        t.expandMemo(memo);
        t.expandedMemo = memo;
      }
    };
    var collapseMemo = function(memo, callback) {
      memo.animate({width: 195}, 0, callback);
      memo.removeClass("expanded");
      t.collapseMemo(memo);
    };

    this.memoProxy.queue(item.from, item.to, function(data) {
      t.makeBody(item, body, data, function () {
        var memos = body.find("div.memo");
        memos.mouseup(function(e) {
       
        if(e.target.nodeName.toLowerCase() == "object" || e.target.nodeName.toLowerCase() == "embed"){return};
          if (e.which === 1 && e.pageX === t.startX && e.pageY === t.startY) {
            var memo = $(this);
            expandMemo(memo);
          }
        });
        if (callback) {
          callback();
        }
      });
    });
  } else {
    slot.addClass("empty");
    if (callback) {callback();}
  }
  var obj = {
    index: index,
    element: slot
  };
  return obj;
  
};

MemoLane.TimeLine.prototype.balance = function() {
  var d = (this.timelineX + this.preferredOffset) / this.slotWidth;
  if (d < 0) {
    var c = Math.floor(-d);
    for (var i = 0; i < c; i++) {
      var slot = this.slots.shift();
      slot.element.remove();
      this.timelineX += this.slotWidth;
      this.timeline.css("left", this.timelineX + "px");
    }
    var index = _.last(this.slots).index;
    for (var i = 1; i <= c; i++) {
      var slot = this.makeSlot(index + i);
      this.slots.push(slot);
      this.timeline.append(slot.element);
    }
  } else {
    var c = Math.ceil(d);
    for (var i = 0; i < c; i++) {
      var slot = this.slots.pop();
      slot.element.remove();
    }
    var index = _.first(this.slots).index;
    for (var i = 1; i <= c; i++) {
      var slot = this.makeSlot(index - i);
      this.slots.unshift(slot);
      this.timeline.prepend(slot.element);
      this.timelineX -= this.slotWidth;
      this.timeline.css("left", this.timelineX + "px");
    }
  }

};

MemoLane.TimeLine.prototype.moveSlots = function(i) {
  if (this.lock) {
    return;
  } else {
    this.lock = true;
  }

  var d = i * this.slotWidth;
  var t = this;
  var w = this.viewport.width();
  t.$rightEmptySlot = t.timeline.find('.slot:not(.empty):last').next();
  t.$leftEmptySlot = t.timeline.find('.slot:not(.empty):first').prev();
  
  //stop if at end of timeline either side
  if(i<0){
    if(t.$rightEmptySlot.length){
      if(t.$rightEmptySlot.offset().left < w){
        t.lock=false;
        return;
      }
    }
  }else{
    if(t.$leftEmptySlot.length){
      if(t.$leftEmptySlot.offset().left > 0){
        t.lock=false;
        return;
      }
    }
  }
  
  this.timeline.animate({left: this.timelineX + d}, 'fast', function() {
    t.timelineX += d;
    t.balance();
    t.lock = false;
  });
  
  this.moveBarLineMark();
  
};

MemoLane.TimeLine.prototype.moveScreens = function(i) {
  if (this.lock) {
    return;
  } else {
    this.lock = true;
  }

  var w = this.viewport.width();
  var t = this;
  t.$rightEmptySlot = t.timeline.find('.slot:not(.empty):last').next();
  t.$leftEmptySlot = t.timeline.find('.slot:not(.empty):first').prev();

  if (i < 0) {
  
    //stop if at end of timeline
    if(t.$rightEmptySlot.length){
      if(t.$rightEmptySlot.offset().left < w){
        t.lock=false;
        return;
      }
    }
    
    var x = (w - this.timelineX) % this.slotWidth;
    var d = w - x - 5;
    
    this.timeline.animate({left: this.timelineX - d}, 'slow', function() {
      t.timelineX -= d;
      t.balance();
      t.lock = false;
    });
  } else {

    //stop if at end of timeline 
    if(t.$leftEmptySlot.length){
        if(t.$leftEmptySlot.offset().left > 0){
            t.lock=false;
            return;
        }
    }   
    
    var x = this.slotWidth + (this.timelineX % this.slotWidth);
    var d = w - x - 5;

    this.timeline.animate({left: this.timelineX + d}, 'slow', function() {
      t.timelineX += d;
      t.balance();
      t.lock = false;
    });
  }
  
  this.moveBarLineMark();

};

MemoLane.TimeLine.prototype.moveBarLineMark = function(){

    var slotFocused; //date in center of viewport
    
    $('.notEmpty').each(function(i,el){//find which slot is in the center of viewport
        if($(el).offset().left>$(window).width()/2){
            slotFocused = parseFloat($(el).attr('id'));
            return false;
        }
    });
    
    var fromTime = this.list[0].from; //grab start date
    var toTime = this.list[this.list.length-1].to; //grab end date
    var deltaSec = toTime - fromTime; //find delta or time between start and end date
      
    var barlineArray = new Array($('#barline').width()); //create an array with a length equal to the length of the viewport
   
    $.each(barlineArray,function(i,v){//lop over our array and place a date into the array for each pixel much like the barline 
        barlineArray[i] = Math.ceil( ( ( i / $('#barline').width() ) * deltaSec ) + fromTime );
    });
    
    var indexBL = 0; //create an index to store where we are in the array
    var barLineArrayLength = barlineArray.length;

    /*loop over the array and stop on the index of the array where are time is greater then the value in the array, this will give us the pixel amount from the left side of the screen we should place out mark*/
    for (; indexBL < barLineArrayLength; indexBL++) {
        if (slotFocused < barlineArray[indexBL]){
            break;
        }
    }
    
    $('.markerHere').css('left',(indexBL>$(window).width()?$(window).width():indexBL-1)+'px'); //update mark on barline
    
}



//old code for scrolling thumbnails in flickr/picaso memo's
MemoLane.ThumbnailsScroll = function(thumbnails) {//retro fitted
  this.thumbnails = thumbnails;
  var t = this;
  this.thumbnails.mousedown(function(e) {
    return false;
  });

  var stopDrag = function(e) {
 
    $(e.target).trigger('safeclick');

  };
  this.thumbnails.mouseup(stopDrag);

};


//run on DOM load 
$(function() {

  var win = $(window);
  var offset = $("#top").outerHeight() + $("#barline").outerHeight() + $("#bottom").outerHeight();
  win.resize(
    function() {
      var height = win.height() - offset;
      $("#timeline").height(height).fadeIn('fast');
      $("#barline .barlane").css('visibility','visible');
      $('.body').css('top','0px');
      if (barline) {
      barline.calibrate();
        MemoLane.timeline.moveBarLineMark();
      }
    });

  win.resize();

  var makeUrl = function(startTime, endTime) {
    return "/day/" + startTime + "/" + endTime;
  };

  var barline = null;

  var init = function(list) { //list is an array of from and to times

    if (list.length > 0) {
      //construct Timeline object
      var timeline = new MemoLane.TimeLine($("#timeline"), list, makeUrl, MemoLane.memoHandlers);
      
      MemoLane.timeline = timeline;
      
      //key events to navigate timeline
      $(document).keyup(
        function(event) {
          var kc = event.keyCode;
          if($('.search input').data('hasFocus')){return;}
          if (kc === 37) {
            if (event.shiftKey) {
              timeline.moveScreens(1);
            } else {
              timeline.moveSlots(1);
            }
          } else if (kc === 39) {
            if (event.shiftKey) {
              timeline.moveScreens(-1);
            } else {
              timeline.moveSlots(-1);
            }
          }
        });
        
      //get the very first time and last time of all memo's
      var startTime = list[0].from;
      var endTime = list[list.length - 1].to;
      
      
      //contruct Barline object
      barline = new MemoLane.BarLine($("#barline"), startTime, endTime, function(time) {
    timeline.jump(time);
      });
      
      $('.markerHere').css('left',($(window).width()-1)+'px'); //update mark on barline

      $("#viewport > .nav > .backward").click(function() {
        timeline.moveScreens(1);
      });
      $("#viewport > .nav > .forward").click(function() {
        timeline.moveScreens(-1);
      });

    } else {//list is empty
    
      $("#barline").hide();
      $("#viewport > .nav").hide();
      
      //check if we have a message to display
      if( $("#message_overlay h1").text() != "" ) {
         $("#message_overlay").show();
      }
      
      $('#viewport').css('background','none');
      
    }

  };
  
  
  //do we have an articular time we want to jump to in a hashanchor
  var showAt = -1;
  var showIndex = -1;
  
  var hash = window.location.hash;
  if( hash ) {
    var value = hash.substring(1); // remove #
    if( value.substring( 0, 2 ) == "t=" ) {
      showAt = value.substring(2);
    } else {
      showAt = value;
    }
  }
  
  MemoLane.initialIndex = 0;
  var url = $("#urls .volume").attr("href");
  if( url != "" ) {
    Gnarly.json(['get', url], function(xhr, data) { //get volume json object
      if (xhr.status === 200) {
		data = {"rows":[{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,2,14],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,2,29],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,2,30],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,2],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,9],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,10],"value":17},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,11],"value":30},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,12],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,13],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,14],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,18],"value":7},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,28],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,29],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,3,30],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,3],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,6],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,13],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,14],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,17],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,20],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,21],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,23],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,24],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,25],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,26],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,27],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,28],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,30],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,4,31],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,2],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,3],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,9],"value":7},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,13],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,16],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,18],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,20],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,23],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,24],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,27],"value":7},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,5,28],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,4],"value":6},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,11],"value":13},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,16],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,21],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,22],"value":6},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,23],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,6,28],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,1],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,11],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,18],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,20],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,22],"value":7},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,24],"value":6},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,29],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,30],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,7,31],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,3],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,12],"value":11},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,13],"value":10},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,16],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,17],"value":7},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,18],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,19],"value":16},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,20],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,22],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,23],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,24],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,25],"value":7},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,26],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,27],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,8,29],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,1],"value":69},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,4],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,10],"value":29},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,17],"value":11},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,24],"value":12},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,25],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,26],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,27],"value":15},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,28],"value":11},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,29],"value":15},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,30],"value":29},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,9,31],"value":14},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,1],"value":2},{"key":["8a3d3bed",2010,10,2],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,3],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,4],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,5],"value":13},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,6],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,7],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,8],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,9],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,10],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,11],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,14],"value":33},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,15],"value":6},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,16],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,17],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,18],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,19],"value":23},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,20],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,22],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,23],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,24],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,25],"value":3},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,26],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,28],"value":14},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,29],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,10,30],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,1],"value":13},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,2],"value":6},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,3],"value":14},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,4],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,5],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,6],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,7],"value":5},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,8],"value":13},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,9],"value":12},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,10],"value":8},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,11],"value":30},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,12],"value":15},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,13],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,14],"value":10},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,15],"value":17},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,16],"value":10},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2010,11,17],"value":4},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2011,0,8],"value":2},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2011,0,13],"value":1},{"key":["8a3d3bacd1eef863886c00023c5dc8ed",2011,0,14],"value":1}]};
        if( data ) {
            
          var list = new Array(data.rows.length);
          
          var lastTo = 0;
          $.each(data.rows, function(i, e) {//rows are an array of objects 
            var key = e.key;
            var date = new Date(0);
            date.setUTCFullYear(key[1], key[2], key[3]);//grab date from rows array
            var fromTime = date.valueOf() / 1000; //seconds from 1970 to today dates
            var toTime = fromTime + 86400; //add 24 hours in seconds to get fromTime
            
            if( lastTo < showAt && showAt < toTime ){
              MemoLane.initialIndex = i;
            }
            
            lastTo = toTime;
              
            var s = {
              from: fromTime,
              to: toTime
            };
            list[i] = s; //make array containing unix time stamp with time range in 24 hours
          });
          
          if( MemoLane.initialIndex != 0 ){
            MemoLane.initialIndex = list.length - MemoLane.initialIndex;
          }
          init(list); //pass array of from and to times to init func
        } else {
          init([]);   
        }
      } else {
        init([]);      
      }
    });
  } else {
    init([]);
  }
  
});


// To be deleted
$(function() {

  var menu = $("#top > .menus > ul.menu.user");

  var dropdown = $("#top > .menus > .dropdown.user");
  dropdown.width(menu.outerWidth() - 32);

  var selected = null;

  var hide = function(element) {
    dropdown.hide();
    selected.button.removeClass("selected");
    selected.body.removeClass("selected");
    selected = null;
  };

  var show = function(element) {
    if (selected) {
      selected.button.removeClass("selected");
      selected.body.removeClass("selected");
    } else {
      dropdown.show();
    }
    selected = element;
    selected.button.addClass("selected");
    selected.body.addClass("selected");
  };

  var toggle = function(element) {
    if (selected === element) {
      hide(selected);
      return false;
    } else {
      show(element);
      return true;
    }
  };

  var profile = {
    button: menu.find("> li.profile"),
    body: dropdown.find("> div.profile")
  };
  profile.button.click(function() {
    toggle(profile);
  });

  var settings = {
    button: menu.find("> li.settings"),
    body: dropdown.find("> div.settings")
  };
  settings.button.click(function() {
    toggle(settings);
  });

  var makeUserListItem = function(e, state) {
    var li = $("<li/>");

    //TODO: Image8 this stuff, but that is a little tricky due to image8 and counc potentially being on seperate hosts
    var img = $("<img class=\"image\" src=\"/" + e.username + "/image" + "\" href=\"/" + e.username + "\"/>");
    var a = $("<a class=\"name\" href=\"/" + e.username + "\"/>");
    li.append(img);
    li.append(a);
    if (state === "accepted") {
      var remove = $("<a class='link' href='/friends/" + e.username + "'>Remove</a>");
      remove.click(function(e) {
        e.preventDefault();
        var url = $(this).attr("href");
        $.post(url, {"_method": "DELETE"}, function() {
          loadFriends();
        });
      });
      li.append(remove);
    }
    if (e.first_name && e.last_name) {
      a.text(e.first_name + " " + e.last_name);
    } else {
      a.text(e.username);
    }
    return li;
  };

  var loadFriends = function() {
    MemoLane.Friends.friends(function(data, state) {
      var ul = $("#top > .menus > .dropdown.user > .share ul.friends").empty();
      $.each(data, function(i, e) {
    var li = makeUserListItem(e, state);
    ul.append(li);
      });
    });
  };

  var loadFriendRequests = function() {
    MemoLane.Friends.requested(function(data) {
      //hide the friends request header if there are no requests
      if(data.length == 0) {
        var requests = $("#top > .menus > .dropdown.user > .share #friend_requests").empty();
        requests.hide();
        return;
      }

      var ul = $("#top > .menus > .dropdown.user > .share ul.requests").empty();

      $.each(data, function(i, e) {
        var li = makeUserListItem(e);
        var buttons = $("<ul class=\"buttons\"/>");
        li.append(buttons);
        var accept = $("<li class=\"link\">Accept</li>");
        accept.click(function() {
          $.post("/friends/" + e.username + "/accept", function(data, status) {
            // TODO: Error handling
            loadFriendRequests();
            loadFriends();
          });
        });
        buttons.append(accept);
        var reject = $("<li class=\"link\">Reject</li>");
        reject.click(function() {
          $.post("/friends/" + e.username + "/reject", function(data, status) {
            // TODO: Error handling
            loadFriendRequests();
          });
        });
        buttons.append(reject);
        ul.append(li);
      });
    });
  };

  var share = {
    button: menu.find("> li.share"),
    body: dropdown.find("> div.share")
  };
  share.button.click(function() {
    if (toggle(share)) {
      loadFriendRequests();
      loadFriends();
    }
  });

  var feed = {
    button: menu.find("> li.feed"),
    body: dropdown.find("> div.feed"),
    list: dropdown.find("> div.feed > ul"),
    makeFeedItem: function(data) {
      var li = $("<li />");
      var handler = MemoLane.Feed.Handlers[data.feed_type];
      if (handler) {
        li.append(handler(data));
        return li;
      } else {
        return false;
      }
    },
    load: function() {
      var that = this;
      that.list.empty();
      $.get("/feed", function(data) {
        _.each(data.feeds, function(entry) {
          e = entry;
          var item = that.makeFeedItem(entry);
          if (item) {that.list.append(item);}
        });
      });
    }
  };
  
  feed.button.click(function() {
    if (toggle(feed)) {
      feed.load();
    }
  });

  var invite = {
    button: menu.find("> li.invite"),
    body: dropdown.find("> div.invite")
  };
  invite.button.click(function() {
    toggle(invite);
  });

  var newStory = $("#urls .story").attr("new_story")
 
  if( newStory ) {
 
    var storyHelpTemplate =  Haml('\
#newStoryHelp.jqmWindow\n\
  %a.closeModal{href: "#"} Close\n\
  %ol\n\
    %li Name your story and add a description. Do this by clicking (edit in place) on the "Story Name" and "Story Description" in the green Menu bar.\n\
    %li Set your privacy options (private by default) from the privacy dropdown menu in the green menu bar.\n\
    %li Invite contributors to your story from the contributors dropdown menu in the green menu bar.\n\
    %li Add memos to the Story by clicking on the "Add Memos" in the green menu bar.');          
                   
                               
    dialog = $(storyHelpTemplate({}));               
    $(document.body).append(dialog);
    
    dialog.find("a.closeModal").click( function() {
      dialog.jqmHide();
      return false;
    });
  
    dialog.jqm({modal: true, trigger: false});
    dialog.jqmShow();
  
  }
  
  $('#addingMemos').live('click',function(){
    window.location.href = 'http://'+window.location.hostname+window.location.pathname+'/add';
    return false;
  });

});


$.fn.imagesLoaded = function(callback){
  var elems = this.filter('img'),
      len = elems.length;
      
  elems.bind('load',function(){
      if (--len <= 0){ callback.call(elems,this); }
  }).each(function(){
     // cached images don't fire load sometimes, so we reset src.
     if (this.complete || this.complete === undefined){
        var src = this.src;
        // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
        // data uri bypasses webkit log warning (thx doug jones)
        this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        this.src = src;
     }
  });

  return this;
};
