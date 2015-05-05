$(function() {
	var Bookmark = Backbone.Model.extend({

		defaults : function() {
			return {
				title : "",
				url : "",
				remark : "",
				order : Bookmarks.nextOrder(),
				done : false
			};
		},

		toggle : function() {
			this.save({
				done : !this.get("done")
			});
		}

	});

	var BookmarkList = Backbone.Collection.extend({
		
		model : Bookmark,
		
		localStorage : new Backbone.LocalStorage("bookmarks-backbone"),
		done : function() {
			return this.where({
				done : true
			});
		},

		remaining : function() {
			return this.without.apply(this, this.done());
		},

		nextOrder : function() {
			if (!this.length){
				return 1;
			}
			return this.last().get('order') + 1;
		},

		comparator : 'order'

	});

	var currentViewObj=null;
	
	var Bookmarks = new BookmarkList;

	var BookmarkView = Backbone.View.extend({

		tagName : "li",
		template : _.template($('#item-template').html()),
		events : {
			"click .toggle" : "toggleDone",
			"click a.delete" : "clear",
			"click .edit" : "doEdit"
		},

		initialize : function() {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},

		render : function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('done', this.model.get('done'));
			this.title = this.$('#new-title');
			this.url = this.$('#new-url');
			this.remark = this.$('#new-remark');
			return this;
		},

		toggleDone : function() {
			this.model.toggle();
		},

		doEdit : function(e) {  
			$("#new-btn").addClass("hide");
			$("#edit-btn").removeClass("hide");
			$('#new-id').val(this.model.attributes["order"]);
			$('#new-title').val(this.model.attributes["title"]);
			$('#new-url').val(this.model.attributes["url"]);
			$('#new-remark').val(this.model.attributes["remark"]);
			currentViewObj=this;
		},
		
		clear : function() {
			if(confirm("Do you confirm to delete this item?")){
				this.model.destroy();
			}
		}

	});

	var AppView = Backbone.View.extend({

		el : $("#bookmark-app"),

		statsTemplate : _.template($('#stats-template').html()),

		events : {
			"click #new-btn" : "doCreate",
			"click #clear-completed" : "clearCompleted",
			"click #toggle-all" : "toggleAllComplete",
			"click #edit-btn" : "doUpdate"
		},

		initialize : function() {

			this.title = this.$('#new-title');
			this.url = this.$('#new-url');
			this.remark = this.$('#new-remark');
			this.allCheckbox = this.$("#toggle-all")[0];

			this.listenTo(Bookmarks, 'add', this.addOne);
			this.listenTo(Bookmarks, 'reset', this.addAll);
			this.listenTo(Bookmarks, 'all', this.render);

			this.footer = this.$('footer');
			this.main = $('#main');

			Bookmarks.fetch();
		},

		render : function() {
			var done = Bookmarks.done().length;
			var remaining = Bookmarks.remaining().length;

			if (Bookmarks.length) {
				this.main.show();
				this.footer.show();
				this.footer.html(this.statsTemplate({
					done : done,
					remaining : remaining
				}));
			} else {
				this.main.hide();
				this.footer.hide();
			}

			this.allCheckbox.checked = !remaining;
		},

		addOne : function(bookmark) {
			var view = new BookmarkView({
				model : bookmark
			});
			this.$("#bookmark-list").append(view.render().el);
		},

		addAll : function() {
			Bookmarks.each(this.addOne, this);
		},

		isEmpty:function(obj){
			if($.trim(obj.val())==""){
				obj.focus();
				return true;
			}
			return false;
		},
		
		checkUrl:function(obj){
			var s=$.trim(obj.val());
			if(s.indexOf('http')==-1){
				obj.val('http://'+s);
			}
		},
		
		doCreate : function(e) {
			
			if(this.isEmpty(this.title) ||this.isEmpty(this.url) ){
				return;
			}
		    this.checkUrl(this.url);
			Bookmarks.create({
				title : this.title.val(),
				url : this.url.val(),
				remark : this.remark.val()
			});
			this.title.val('');
			this.url.val('');
			this.remark.val('');
		},
		
		doUpdate:function(){
			var that=currentViewObj;
			var o_title=$("#new-title");
			var o_url=$("#new-url");
			var o_remark=$("#new-remark");
			if(this.isEmpty(o_title) ||this.isEmpty(o_url) ){
				return;
			} 
			this.checkUrl(o_url);  
			that.model.save({
				title : o_title.val(),
				url : o_url.val(),
				remark : o_remark.val()
			});
			o_title.val('');
			o_url.val('');
			o_remark.val('');
			$("#edit-btn").addClass("hide");
			$("#new-btn").removeClass("hide");
		},

		clearCompleted : function() {
			if(confirm("Do you really want to delete the checked item(s)?")){
				_.invoke(Bookmarks.done(), 'destroy');
			}
			return false;
		},

		toggleAllComplete : function() {
			var done = this.allCheckbox.checked;
			Bookmarks.each(function(bookmark) {
				bookmark.save({
					'done' : done
				});
			});
		}

	});

	var App = new AppView;

});
