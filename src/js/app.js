App = {
    debug: true,
    web3Provider: null,
    contracts: {},
    account: '0x0',

    init: async function () {
        return await App.initWeb3();
    },

    initWeb3: async function () {
// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
// Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
// If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function () {
        $.getJSON('Football.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FootballArtifact = data;
            App.contracts.Football = TruffleContract(FootballArtifact);

            // Set the provider for our contract
            App.contracts.Football.setProvider(App.web3Provider);
            App.listenForEvents();

            // Load account data
            web3.eth.getCoinbase(function (err, account) {
                if (err === null) {
                    App.account = account;
                    $("#accountAddress").html("Your Account: " + account);
                }
            });

            return App.bindEvents();

        });
    },


    bindEvents: function () {
        $("#fillTestDataButton").on('click', function () {
            App.fillTestData();
        });
        $("#ownerAllPlayersButton").on('click', function () {
            App.getOwnerAllPlayers();
        });
        $("#ownerAllTransferPlayersButton").on('click', function () {
            App.getOwnerAllTransferPlayers();
        });
        $("#ownerAllAvailablePlayersButton").on('click', function () {
            App.getOwnerAllAvailablePlayers();
        });
        $("#allPlayersButton").on('click', function () {
            App.getAllPlayers();
        });
        $("#allTransferPlayersButton").on('click', function () {
            App.getAllTransferPlayers();
        });
        $("#allAvailablePlayersButton").on('click', function () {
            App.getAllAvailablePlayers();
        });
        $("#buyPlayerButton").on('click', function () {
            App.buyPlayer(playerId);

        });
        $("#sellPlayerButton").on('click', function () {
            var playerId = $("#playerIdInput").val();
            var price = $("#price").val();
            App.preparePlayerForTransfer(playerId, price);
        });
        $("#testButton").on('click', function () {
            var playerId = $("#playerIdInput").val();
            App.getPlayerOwner(playerId);
            App.isPlayerInTransfer(playerId);
            App.getPlayerSellPrice(playerId);
            App.getPlayerName(playerId);
            App.getPlayersCount();
            // App.getTest();
        });
    },
    listenForEvents: function () {
        App.contracts.Football.deployed().then(function (instance) {
            instance.PrepareTransferEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                console.log("PrepareTransferEvent event triggered", event)
            });
            instance.BuyPlayerEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                console.log("BuyPlayerEvent event triggered", event)
            });
        });
    },
    addPlayer: function (name, age) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.addPlayer(name, age);
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    },
    getOwnerAllAvailablePlayers: function () {
        App.getAllOwnerPlayersDependsOnStatus(false);
    },

    getOwnerAllTransferPlayers: function () {
        App.getAllOwnerPlayersDependsOnStatus(true);
    },

    getOwnerAllPlayers: function () {
        return new Promise(function (resolve, reject) {
            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.log(error);
                }
                let currAccount = accounts[0];

                App.contracts.Football.deployed()
                    .then(function (instance) {
                        return instance.getAllPlayers.call();
                    })
                    .then(function (playersIds) {
                        var resultArray = [];
                        $.each(playersIds, function (index, playerId) {
                            var state = App.contracts.Football.deployed()
                                .then(function (instance) {
                                    return instance.getPlayerOwner.call(playerId);
                                })
                                .then(function (playerOwner) {
                                    if (playerOwner == currAccount) {
                                        return playerId;
                                    }
                                });
                            resultArray.push(state);
                        });
                        return resultArray;

                    })
                    .then(function (promisesArray) {
                        Promise.all(promisesArray).then(values => {
                            var filteredValues = values.filter(function (el) {
                                return el != null;
                            });
                            console.log("Owner all players:" + filteredValues);
                            resolve(filteredValues);
                        })
                    })
                    .catch(function (err) {
                        console.log(err.message);
                    })

            });
        });
    }, getAllPlayers: function () {
        return new Promise(function (resolve, reject) {
            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.log(error);
                }

                App.contracts.Football.deployed()
                    .then(function (instance) {
                        return instance.getAllPlayers.call();
                    })
                    .then(function (allPlayers) {
                        console.log("All players: " + allPlayers);
                        resolve(allPlayers);
                    })
                    .catch(function (err) {
                        console.log(err.message);
                    });

            });
        })

    }, getAllPlayersDependsOnStatus:

        function (isTransferStatus) {
            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.log(error);
                }

                // App.contracts.Football.deployed()
                //     .then(function (instance) {
                //         return instance.getAllPlayers.call();
                //     })
                App.getAllPlayers()
                    .then(function (playersIds) {
                        var resultArray = [];
                        $.each(playersIds, function (index, playerId) {
                            var state = App.contracts.Football.deployed()
                                .then(function (instance) {
                                    return instance.isPlayerInTransfer.call(playerId);
                                })
                                .then(function (isPlayerInTransfer) {
                                    console.log("isPlayerInTransfer: " + isPlayerInTransfer);
                                    if (isTransferStatus == isPlayerInTransfer) {
                                        return playerId;
                                    }
                                });
                            resultArray.push(state);
                        });
                        return resultArray;
                    })
                    .then(function (promisesArray) {
                        Promise.all(promisesArray).then(values => {
                            var filteredValues = values.filter(function (el) {
                                return el != null;
                            });
                            console.log("values:" + filteredValues);
                            return filteredValues;
                        })
                    })
                    .catch(function (err) {
                        console.log(err.message);
                    })

            });

        }

    ,
    getAllOwnerPlayersDependsOnStatus: function (isTransferStatus) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.getOwnerAllPlayers()
                .then(function (playersIds) {
                    var resultArray = [];
                    $.each(playersIds, function (index, playerId) {
                        var state = App.contracts.Football.deployed()
                            .then(function (instance) {
                                return instance.isPlayerInTransfer.call(playerId);
                            })
                            .then(function (isPlayerInTransfer) {
                                console.log("isPlayerInTransfer: " + isPlayerInTransfer);
                                if (isTransferStatus == isPlayerInTransfer) {
                                    return playerId;
                                }
                            });
                        resultArray.push(state);
                    });
                    return resultArray;
                })
                .then(function (promisesArray) {
                    Promise.all(promisesArray).then(values => {
                        var filteredValues = values.filter(function (el) {
                            return el != null;
                        });
                        console.log("values:" + filteredValues);
                        return filteredValues;
                    })
                })
                .catch(function (err) {
                    console.log(err.message);
                })

        });

    }
    ,
    getAllTransferPlayers: function () {
        return App.getAllPlayersDependsOnStatus(true);
    }
    ,
    getAllAvailablePlayers: function () {
        return App.getAllPlayersDependsOnStatus(false);
    }
    ,
    isPlayerInTransfer: function (playerId) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.isPlayerInTransfer.call(playerId);
                })
                .then(function (data) {
                    console.log("isPlayerInTransfer: " + data);
                    return data;
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    getPlayerSellPrice: async function (playerId) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.getPlayerSellPrice.call(playerId);
                })
                .then(function (data) {
                    console.log("getPlayerSellPrice: " + data);
                    return data.c;
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    getPlayerOwner: async function (playerId) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.getPlayerOwner.call(playerId);
                })
                .then(function (data) {
                    console.log("getPlayerOwner: " + data);
                    return data.c;
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    getPlayerName: async function (playerId) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.getPlayerName.call(playerId);
                })
                .then(function (data) {
                    console.log("getPlayerName: " + data);
                    return data.c;
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    getPlayersCount: async function () {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.getPlayersCount.call();
                })
                .then(function (data) {
                    console.log("getPlayersCount: " + data);
                    return data.c;
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    buyPlayer: function (playerId) {
        web3.eth.getAccounts(async function (error, accounts) {
            if (error) {
                console.log(error);
            }
            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.getPlayerSellPrice.call(playerId);
                }).then(function (playerSellCost) {
                App.contracts.Football.deployed()
                    .then(function (instance) {
                        var playerCost = web3.toWei(playerSellCost);
                        return instance.buyPlayer(playerId, {value: playerCost, from: App.account});
                    })
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    preparePlayerForTransfer: function (playerId, sellPrice) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.preparePlayerForTransfer(playerId, sellPrice);
                })
                .then(function (data) {
                    console.log("data: " + data);
                }).catch(function (err) {
                console.log(err.message);
            });
        });
    }
    ,
    getTest: function () {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }


            App.contracts.Football.deployed()
                .then(function (instance) {
                    return instance.getAllPlayers.call();
                }).then(function (playersIds) {
                var resultArray = [];
                $.each(playersIds, function (index, playerId) {
                    var state = App.contracts.Football.deployed()
                        .then(function (instance) {
                            return instance.isPlayerInTransfer.call(playerId);
                        })
                        .then(function (data) {
                            console.log("isPlayerInTransfer: " + data);
                            return data;
                        });
                    resultArray.push(state);
                });
                return resultArray;

            }).then(function (promisesArray) {
                Promise.all(promisesArray).then(values => {
                    console.log("values:" + values);
                    return values;
                })
            }).catch(function (err) {
                console.log(err.message);
            })


        });
    }
    ,
    fillTestData: function () {
        App.addPlayer($("#name1").val(), 1);
        App.addPlayer($("#name2").val(), 2);
        // App.addPlayer("Artsiom", 25);
        // App.addPlayer("Artyom", 25);
        // App.addPlayer("Artemis", 25);
        // App.addPlayer("Artemios", 25);
        // App.addPlayer("Vitalik", 25);
        // App.addPlayer("Oleg", 25);
        // App.addPlayer("Viktor", 25);
        // App.addPlayer("Alex", 25);
        // App.addPlayer("Vlad", 25);
    }
    ,


}
;

$(function () {
    $(window).load(function () {
        App.init();
    });
});
