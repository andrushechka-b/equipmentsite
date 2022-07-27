function get_details(result) {
	var text = "";
	for (let key in result) text = text + key + " : " + result[key] + "\n";
	return text
}

const apiHost = document.location.origin + '/'

function callAPI(requestOptions, URL, action) {
	fetch(URL, requestOptions)
	.then(response => {
		console.log(response)
		if (response.ok){
			const contentType = response.headers.get("content-type");
			if (contentType && contentType.indexOf("application/json") !== -1) {
				response.json()
				.then(function (result) {
					console.log(result);
					action(result);
				})
			} else action();
		} else{
			response.json()
			.then(result => {
				console.log(result)
				alert(
					"Server returned " + response.status + " : " + response.statusText + "\n" +
					get_details(result)
				);
			}, error => console.log(error))
		}
	})
}

var app = new Vue({
	el: '#formAdd',
	data: {
		selected_type: '',
		serial_number: '',
		note: '',
		options: [],
	},
	methods: {
		sendData() {
			var serial_number = this.serial_number.trim().split(/\s+/);
			console.log(serial_number)
			const requestOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					serial_number: serial_number,
					note: this.note,
					//type: "http://127.0.0.1:8000/api/equipment-type/" + this.selected_type.toString() + "/"
					type: this.selected_type
				})
			};
			console.log(requestOptions)
			fetch("http://127.0.0.1:8000/api/equipment/", requestOptions)
			.then(response => {
				console.log(response)
				if(response.ok){
					return response.json()    
				} else {
					response.json()
					.then(result => {
						console.log(result)
						function get_details(result) {
							var text = "";
							for (let key in result) text = text + key + " : " + result[key] + "\n";
							return text
						}
						alert(
							"Server returned " + response.status + " : " + response.statusText + "\n" +
							get_details(result)
						);
					})
				}
			})
		}
	}
})
fetch("http://127.0.0.1:8000/api/equipment-type/", {
	"method": "GET"
})
.then(response => {
	console.log(response)
	if(response.ok){
		return response.json()    
	} else{
		response.json()
		.then(result => {
			alert(
				"Server returned " + response.status + " : " + response.statusText + "\n" +
				result.detail
			);
		})
	}                
})
.then(response => {
	console.log(response)
	app.options = response
	app2.options = app.options
	//for (const idx in response) {
	//	app.options.push(response[idx].name)
	//}
})

Vue.component('equipment-item', {
	delimiters: ["[[","]]"],
	data: function () {
		return {
			mode: 0,
			type: this.equipment.type,
			serial_number: this.equipment.serial_number,
			note: this.equipment.note,
		}
	},
	template:
	'\
		<tr>\
			<td>\
				<select :disabled="mode == 0" v-model="type">\
					<option v-for="option in options" v-bind:value="option.id">\
						[[ option.name ]]\
					</option>\
				</select>\
			<td><input :readonly="mode == 0" v-model="serial_number"></td>\
			<td><input :readonly="mode == 0" v-model="note"></td>\
			<td>\
				<template v-if="mode == 0">\
					<button v-on:click="mode = 1">Изменить</button>\
					<button v-on:click="$emit(\'remove\')">Удалить</button>\
				</template>\
				<template v-if="mode == 1">\
					<button v-on:click="mode = 0; save()">Сохранить</button>\
					<button v-on:click="mode = 0; reload()">Отмена</button>\
				</template>\
			</td>\
		</tr>\
	',
	props: ['equipment', 'options'],
	methods: {
		reload :function () {
			console.log('reload', this.equipment.note);
			this.type = this.equipment.type;
			this.serial_number = this.equipment.serial_number;
			this.note = this.equipment.note;
		},
		save : function () {
			this.$emit('modify', {
				type: this.type,
				serial_number: this.serial_number,
				note : this.note,
			})
		},
	}
})

app2 = new Vue({
	el: '#formView',
	data: {
		searchText: '',
		equipments: [],
		options: [],
		show_load_more: false,
		next_page_url: '',
	},
	methods: {
		getData: function () {
			if (this.searchText.replace(/\s/g, '') == "") {
				alert('Empty search string');
				return
			}
			const requestOptions = {
				method: "GET",
			};
			callAPI(
				requestOptions,
				apiHost + 'api/equipment/?search=' + this.searchText,
				function(response) {
					app2.equipments = response.results;
					if (response.results.length == 0) alert('Nothing found');
					if (response.next) {
						app2.show_load_more = true;
						app2.next_page_url = response.next;
					} else {
						app2.show_load_more = false;
						app2.next_page_url = '';
					}
				}
			)
		},
		addData: function () {
			const requestOptions = {
				method: "GET",
			};
			callAPI(
				requestOptions,
				this.next_page_url,
				function(response) {
					app2.equipments = app2.equipments.concat(response.results);
					if (response.next) {
						app2.show_load_more = true;
						app2.next_page_url = response.next;
					} else {
						app2.show_load_more = false;
						app2.next_page_url = '';
					}
				}
			)
		},
		remData: function (id) {
			console.log('Remove', id)
			const requestOptions = {
				method: "DELETE",
			};
			callAPI(
				requestOptions,
				apiHost + 'api/equipment/' + id.toString() + '/',
				function(response) {app2.getData()}
			)
		},
		modData: function (id, data) {
			console.log('Modify', id, data)
			const requestOptions = {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data)
			};
			callAPI(
				requestOptions,
				apiHost + 'api/equipment/' + id.toString() + '/',
				function(response) {app2.getData()}
			)
		}
	}
})
