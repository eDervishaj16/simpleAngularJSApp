
var app = angular.module('myModule', ['ngMaterial', 'ngMessages', 'ui.bootstrap'])

app.value('paginationData' ,{
    'currentPage': 1,
    'perPageClients': 0,
    'totalClients': 0
})

app.controller('clientController', function($scope, $http, $log, $window, $mdDialog, paginationData){
    // How many pages can you click on
    $scope.maxSize = 10
    $window.onload = function() {
        if($window.localStorage.getItem('userID') === "undefined" || $window.localStorage.getItem('userID') === null || $window.localStorage.getItem('emailCode') === "undefined" || $window.localStorage.getItem('emailCode') === null){
            // Ilegal Access -> Redirect to login
            $log.log('http://localhost:3000/login.html')
            $window.location.href = 'http://localhost:3000/login.html'
        }
    }

    $scope.loadData = function() {
        var body = {
            "pageIndex": paginationData.currentPage
        }
        var header = {
            "Content-Type": "application/json; charset=utf-8"
        }
        var url = 'http://db/DetyreAPI/api/Client/GetClient'

        $http.post(url, body, header)
            .then(res => {
                if(res.data.length === 0) {
                    return
                }
                $scope.clients = res.data
                paginationData.totalClients = res.data.length
                paginationData.perPageClients = res.data.length
                // Make it available for clients.html
                $scope.totalClients = 1104
                $scope.perPageClients = paginationData.perPageClients
            })
            .catch(err => {
                console.log(err)
            }) 
    }

    $scope.updateTable = function(currentPage) {
        if(currentPage !== paginationData.currentPage){
            paginationData.currentPage = currentPage,
            this.loadData()
        }
    }
    $scope.createClient = function(client){
        if(client === undefined)
            return

        if(!client.name || !client.surname || !client.birthdate || !client.address || !client.telephone || !client.latitude || !client.longitude) 
            return

        var date = `${client.birthdate.getFullYear()}-${client.birthdate.getMonth()+1}-${client.birthdate.getDate()}`
        var body = {
            "FirstName": client.name,
            "LastName": client.surname,
            "BirthDate": date,
            "Address": client.address,
            "Tel": client.telephone, 
            "Latitude": client.latitude,
            "Longitude": client.longitude,
            "Active" : true
        }
        var header = {
            "Content-Type": "application/json; charset=utf-8"
        }
        var url = 'http://db/DetyreAPI/api/Client/AddClient'

        $http.post(url, body, header) 
            .then(res => {
                console.log(res)
                $window.location.reload();
            })
            .catch(err =>{
                console.log(err)
            })
    }
    
    
    $scope.delete = function(clientID) {

        const url = 'http://db/DetyreAPI/api/Client/DeleteClient'
        const body = JSON.stringify({
            "Id": clientID
        })        
        const header = {
            "Content-Type": "application/json; charset=utf-8"
        }  

        $http({
            method: 'DELETE',
            url: url,
            data: body,
            headers: header
        })
            .then(res => {
                console.log(res)
                    // Refresh page
                    $window.location.reload()

            })
            .catch(err => {
                console.log(err)
            })
    }   

    $scope.logout = function() {
        // Remove user ID
        $window.localStorage.clear()

        // Refresh page
        $window.location.reload()

    }
    
    $scope.change = function(client) {
        $mdDialog.show({
            templateUrl: 'clientModal.html',
            parent: angular.element(document.body),
            locals: {editClient: client},
            scope: $scope,
            clickOutsideToClose: true,
            fullscreen: $scope.customFullscreen,
            controller: DialogController,
            preserveScope : true
        })
    }

    $scope.sortBy = function(propertyName){
        console.log(propertyName)
        $scope.sortKey = propertyName;
        $scope.reverse = !$scope.reverse;
    }

    function DialogController(editClient, $mdDialog) {
        // Passing the selected user data to modal
        $scope.mdClient = editClient

        $scope.submitChanges = function(updatedUser, previous) {
            // If no changes are made
            if(updatedUser === undefined) {
                $mdDialog.cancel()
            }
            else {
                var newBirthDate
                if(updatedUser.BirthDate!==undefined){
                    newBirthDate = `${updatedUser.BirthDate.getFullYear()}-${updatedUser.BirthDate.getMonth()+1}-${updatedUser.BirthDate.getDate()}`
                }
                var header = {
                    "Content-Type": "application/json; charset=utf-8"
                }
                var url = 'http://db/DetyreAPI/api/Client/UpdateClient'
                var body = {
                    "Id": previous.Id,
                    "FirstName": updatedUser.FirstName === undefined? previous.FirstName : updatedUser.FirstName,
                    "LastName": updatedUser.LastName === undefined? previous.LastName : updatedUser.LastName,
                    "BirthDate": updatedUser.BirthDate === undefined? previous.BirthDate.split(' ')[0] : newBirthDate,
                    "Address": updatedUser.Address === undefined? previous.Address : updatedUser.Address,
                    "Tel": updatedUser.Tel === undefined? previous.Tel : updatedUser.Tel, 
                    "Latitude":  updatedUser.Latitude === undefined? previous.Latitude : updatedUser.Latitude,
                    "Longitude": updatedUser.Longitude === undefined? previous.Longitude : updatedUser.Longitude,
                    "Active" : updatedUser.Active === undefined? previous.Active : updatedUser.Active
                }

                // Making the request to modify the client
                $http.put(url, body, header)
                    .then(res => {
                        console.log(res)
                    })
                    .catch(err =>{
                        console.log(err)
                    })
                // Refresh page so the results are fetched
                $window.location.reload()
            }
        }
        $scope.cancel = function() {
          $mdDialog.cancel();    
        };

        $scope.close = function() {
            $mdDialog.close()
        }
    }

    $scope.openMap = function (long, lat) {
        $mdDialog.show({
            templateUrl: 'mapModal.html',
            parent: angular.element(document.body),
            locals: {long: long, lat: lat},
            scope: $scope,
            clickOutsideToClose: true,
            fullscreen: $scope.customFullscreen,
            controller: MapController,
            preserveScope : true
            
        })
    }

    function MapController(long, lat, $mdDialog) {
        
        angular.element($mdDialog).ready(function () {
            var latlng = new google.maps.LatLng(long, lat);
            $scope.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 3,
                center: latlng
            });

            var marker = new google.maps.Marker({
                position: latlng,
                map: $scope.map,
                title: 'Location'
            });
        })

        $scope.cancel = function() {
          $mdDialog.cancel();    
        };

        $scope.close = function() {
            $mdDialog.close()
        }
    }

})


app.config(function($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function(date) {
       return moment(date).format('DD/MM/YYYY');
    }
})