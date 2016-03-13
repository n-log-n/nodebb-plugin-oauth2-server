<div class="panel panel-default">
    <div class="panel-heading">OAuth Server</div>
    <div class="panel-body">

        <div class="alert alert-danger hidden" id="alert"> Some fields are empty, they won't be saved. </div>
        <div class="template well hidden">
            <form>
                <span class="pull-right"><i class="fa fa-times pointer"></i></span>

                <label>public
                    <input type="text" class="form-control" name="public" id="public" value="{clients.public}" />
                </label>

                <label>private
                    <input type="text" class="form-control" name="private" id="private" value="{clients.private}" />
                </label>

                <label>callback
                    <input type="text" class="form-control" name="callback" id="callback" value="{clients.callback}" />
                </label>
                <a class="btn btn-info gen-key">Auto Gen Keys</a>
            </form>
        </div>

        <div id="clients">
            <!-- BEGIN clients -->
            <div class="well">
                <form>
                    <span class="pull-right"><i class="fa fa-times pointer"></i></span>

                    <label>public
                        <input type="text" class="form-control" name="public" id="public" value="{clients.public}" />
                    </label>

                    <label>private
                        <input type="text" class="form-control" name="private" id="private" value="{clients.private}" />
                    </label>

                    <label>callback
                        <input type="text" class="form-control" name="callback" id="callback" value="{clients.callback}" />
                    </label>
                </form>
            </div>
            <!-- END clients -->
        </div>

        <button class="btn btn-lg btn-success" id="add">Add New Client</button>

        <button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
            <i class="material-icons">save</i>
        </button>
    </div>
</div>

<script>
    function randomString(len){
        var chars = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456789";
        var rs = "";
        while(len--){
            rs += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return rs;
    }
    
    function addButtonsHandler() {
			$('#clients .fa-times').on('click', function () {
                if(confirm("Sure to delete this client?")) {
				    $(this).parents('.well').remove();
                }
			});
            $('#clients .gen-key').on('click', function(){
               $(this).parents('.well').find("#public").val(randomString(16));
               $(this).parents('.well').find("#private").val(randomString(32));
            });
		}

		$('#add').on('click', function (ev) {
			var clone = $('.template').clone().removeClass('template hidden');
			$('#clients').append(clone);

			addButtonsHandler();
		});

		addButtonsHandler();

		$('#save').on('click', function (ev) {
            $("#alert").addClass("hidden");
			var arr = [];
			$('#clients .well form').each(function () {
				var data = $(this).serializeArray();
				if ($.trim(data[0].value) != '' 
                && $.trim(data[1].value) != '' 
                && $.trim(data[2].value) != '' ) {
					arr.push({
						public: data[0].value,
						private: data[1].value,
						callback: data[2].value
					});
				}else{
                    $("#alert").removeClass("hidden");
                }


			});

			socket.emit('admin.settings.saveSettings', arr, function () {
				app.alertSuccess('Settings Saved');
			});
		});

</script>