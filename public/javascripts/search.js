if (!MemoLane.Search) MemoLane.Search = {};

MemoLane.Search.Engine = function(el) {
  var that = this;

  this.el = el;
  this.input = el.find("input");
  
  this.dropdown = $("#top > .panel > .dropdown");
  this.results = this.dropdown.find("> .content ");
  this.results.empty();

  this.url = $("#urls .search").attr("href");

  this.input.focus(function() {
    var v = $(this).val();
        $(this).val( v === this.defaultValue ? '' : v ).css('color','#000');

    that.results.show();
    $(this).data('hasFocus', true);
  });

  this.input.blur(function() {
  var v = $(this).val();
        $(this).val( this.defaultValue ).css('color','#ccc');

    $(this).data('hasFocus', false);
  });

  this.input.keyup(function() {
    var query = $(this).val();
    if( query.length > 0 ) {
      that.dropdown.css('background-image','url(/images/ajax-loader.gif)');
      that.search(query);
    } else {
      that.results.empty();
      that.dropdown.slideUp();
    }
  });

  this.results.find(".result-group li").live('click', function() {
    var timestamp = $(this).find("a").attr("href").substring(1);
    MemoLane.timeline.jump(parseInt(timestamp, 10));
    that.results.empty();
    $('#viewport').css({'background-image':'url("/images/large-loading2.gif")',
                        'background-repeat':'no-repeat',
                        'background-position':'center center'});
    that.dropdown.hide();
    that.input.val("");
  });
};

MemoLane.Search.Engine.prototype = {
  search: function(query) {
    var that = this;

    $.get(that.url, {q: query}, function(data) {
      
      if( data.memos && data.memos.length == 0 && data.users.length == 0 ) {
        that.results.empty();
        var noResults = $(Mustache.to_html( MemoLane.Search.NoResultsTemplate, {} ));
        that.results.append(noResults);
      } else {
    
        if (data.memos) {
          //group memos by service (for now...)
          var services = {};
          $.each(data.memos, function(index, memo) {
            if( !services[memo.service] ) {
              services[memo.service] = [];
            }
            services[memo.service].push( memo );
          });  
          
          that.results.empty();
          
          for (var service in services ) {
            
            var serviceGroup = $(Mustache.to_html( MemoLane.Search.GroupTemplate, {"service": service} ));
            var serviceMemos = that.renderResults(services[service], {"class": "results-memo"});
            serviceGroup.append( serviceMemos );
            that.results.append(serviceGroup);
          }
        }
        
        var userGroup = $("<p color='black'>users</p>");
        userGroup.append( that.renderResults(data.users, {"class": "users"}) );
        
        if( data.users.length > 0 ) {
          that.results.append(userGroup);
        }
      
      }
      
      that.dropdown.css('background-image','none').slideDown();
    });
  },

  renderResults: function(results, options) {
    var that = this;
    var div = $("<div />");
    if (options["class"]) div.addClass(options["class"]);
    var ul = $("<ul />");
    $.each(results, function(index, result) {
      var li = that.renderResult(result);
      if (li) ul.append(li);
    });
    div.append(ul);
    return div;
  },

  renderResult: function(result) {
    var that = this;
    var template = that.findTemplate(result);
    if (template) {
      var html = that.wrapInLink(result, function() {
        return Mustache.to_html(template, result);
      });
      var li = $("<li />");
      li.append(html);
      return li;
    } else {
      return false;
    }
  },

  wrapInLink: function(result, renderer) {
    var that = this;
    var a = $("<a />");
    if (result.type === "memo") {
      a.attr("href", "#" + result.created_at);
    } else if (result.type === "user") {
      a.attr("href", "/" + result.username);
    }
    a.append(renderer());
    return a;
  },

  findTemplate: function(result) {
    var that = this;
    if (result.type === "memo") {
      var template = MemoLane.Search.Templates[result.service];
      if (typeof template === "object") {
        return template[result.sub_type];
      } else {
        return template;
      }
    } else if (result.type === "user") {
      return MemoLane.Search.Templates.user;
    }

    return false;
  }
};

MemoLane.Search.NoResultsTemplate = "<span class='search-result-empty'>No results found</span>";

MemoLane.Search.GroupTemplate = "<div class='result-group'><div class='header'><img src='/images/services/small/{{{service}}}.png'/><span class='service-divider-line'></span><br></div></div>";

MemoLane.Search.Templates = {
  user: [
    "<img class='logo', src='{{image}}' height='25px' width='25px' />",
    "<span>{{username}} ({{first_name}} {{last_name}})</span>"
  ].join("\n"),
  twitter: [
    "<img class='logo', src='/images/search/search_icons/twitter.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  flickr: [
    "<img class='logo', src='/images/search/search_icons/flickr.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  picasa: [
    "<img class='logo', src='/images/search/search_icons/picasa.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  lastfm: [
    "<img class='logo', src='/images/search/search_icons/lastfm.png' />",
    "<span>{{#track}}{{#artist}}{{name}}{{/artist}} - {{name}}{{/track}}</span>"
  ].join("\n"),
  foursquare: [
    "<img class='logo', src='/images/search/search_icons/foursquare.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  tripit: [
    "<img class='logo', src='/images/search/search_icons/tripit.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  feed: [
    "<img class='logo', src='/images/search/search_icons/feed.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  facebook: [
    "<img class='logo', src='/images/search/search_icons/facebook.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n"),
  youtube: [
    "<img class='logo', src='/images/search/search_icons/youtube.png' />",
    "<span>{{#title}}{{text}}{{/title}}</span>"
  ].join("\n")
};

$(document).bind("memolane:topbar:ready", function() {
  var search = new MemoLane.Search.Engine($("#top .search"));
});