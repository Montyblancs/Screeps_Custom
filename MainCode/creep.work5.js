var creep_work5 = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if (creep.carry.energy > 0 && creep.memory.priority != 'miner' && creep.memory.priority != 'minerNearDeath') {
            //All creeps check for road under them and repair if needed.
            var someStructure = creep.pos.lookFor(LOOK_STRUCTURES);
            if (someStructure.length && (someStructure[0].hitsMax - someStructure[0].hits >= 600) && someStructure[0].structureType == STRUCTURE_ROAD) {
                creep.repair(someStructure[0]);
            }
        }

        switch (creep.memory.priority) {
            case 'mule':
            case 'muleNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'muleNearDeath') {
                    creep.memory.priority = 'muleNearDeath';
                }
                if (_.sum(creep.carry) == 0) {
                    creep.memory.structureTarget = undefined;
                    let storageTarget = creep.room.storage;
                    if (storageTarget) {
                        if (creep.room.terminal && storageTarget.store[RESOURCE_ENERGY] < 300000 && creep.room.terminal.store[RESOURCE_ENERGY] > 31000) {
                            //Pull from terminal if given resources
                            if (creep.withdraw(creep.room.terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(creep.room.terminal);
                            }
                        } else if (storageTarget.store[RESOURCE_ENERGY] >= 50) {
                            //Get from container
                            if (creep.withdraw(storageTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(storageTarget);
                            }
                        } else {
                            var spawnTarget = Game.getObjectById(creep.memory.fromSpawn);
                            if (spawnTarget) {
                                if (!creep.pos.isNearTo(spawnTarget)) {
                                    creep.travelTo(spawnTarget);
                                }
                            }
                        }
                    }
                } else if (_.sum(creep.carry) > 0) {
                    if (creep.carry[RESOURCE_ENERGY] == 0) {
                        if (creep.room.terminal) {
                            var currentlyCarrying = _.findKey(creep.carry);
                            if (creep.transfer(creep.room.terminal, currentlyCarrying) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(creep.room.terminal);
                            }
                        } else if (!creep.room.terminal && creep.room.storage) {
                            var currentlyCarrying = _.findKey(creep.carry);
                            if (creep.transfer(creep.room.storage, currentlyCarrying) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(creep.room.storage);
                            }
                        }
                    } else {
                        var savedTarget = Game.getObjectById(creep.memory.structureTarget)
                        var getNewStructure = false;
                        if (savedTarget) {
                            if (creep.build(savedTarget) == ERR_INVALID_TARGET) {
                                //Only other blocker is build.
                                creep.repair(savedTarget);

                                if (creep.memory.lookForNewRampart) {
                                    creep.memory.structureTarget = undefined;
                                    creep.memory.lookForNewRampart = undefined;
                                    var newRampart = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                        filter: (structure) => (structure.structureType == STRUCTURE_RAMPART) && (structure.hits == 1)
                                    });
                                    if (newRampart) {
                                        creep.memory.structureTarget = newRampart.id;
                                        if (creep.repair(newRampart) == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(newRampart);
                                        }
                                    }
                                } else if (savedTarget.structureType != STRUCTURE_CONTAINER && savedTarget.structureType != STRUCTURE_STORAGE && savedTarget.structureType != STRUCTURE_CONTROLLER) {
                                    //Storing in spawn/extension/tower/link
                                    if (creep.transfer(savedTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE && savedTarget.energy < savedTarget.energyCapacity) {
                                        creep.travelTo(savedTarget);
                                    } else {
                                        //assumed OK, drop target
                                        creep.memory.structureTarget = undefined;
                                        getNewStructure = true;
                                    }
                                } else {
                                    //Upgrading controller
                                    if (Memory.linkList[creep.room.name].length > 1) {
                                        var upgraderLink = Game.getObjectById(Memory.linkList[creep.room.name][1]);
                                        if (upgraderLink && upgraderLink.energy < 100) {
                                            if (creep.transfer(upgraderLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(upgraderLink, {
                                                    maxRooms: 1
                                                });
                                            }
                                        } else if (creep.upgradeController(savedTarget) == ERR_NOT_IN_RANGE) {
                                            if (Game.flags[creep.room.name + "Controller"]) {
                                                creep.travelTo(Game.flags[creep.room.name + "Controller"], {
                                                    maxRooms: 1
                                                });
                                            } else {
                                                creep.travelTo(savedTarget, {
                                                    maxRooms: 1
                                                });
                                            }
                                        }
                                    }
                                    //Do repair for new ramparts
                                    creep.repair(savedTarget);
                                }
                            } else {
                                if (creep.build(savedTarget) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(savedTarget);
                                } else if (creep.build(savedTarget) != OK) {
                                    creep.memory.structureTarget = undefined;
                                }
                            }
                        } else {
                            creep.memory.structureTarget = undefined;
                        }
                        //Immediately find a new target if previous transfer worked
                        if (!creep.memory.structureTarget) {
                            var targets = undefined;
                            if (Memory.warMode) {
                                if (getNewStructure) {
                                    targets = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                        filter: (structure) => {
                                            return (structure.structureType == STRUCTURE_EXTENSION ||
                                                structure.structureType == STRUCTURE_SPAWN ||
                                                structure.structureType == STRUCTURE_LAB ||
                                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity && structure.id != savedTarget.id;
                                        }
                                    });
                                } else {
                                    targets = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                        filter: (structure) => {
                                            return (structure.structureType == STRUCTURE_EXTENSION ||
                                                structure.structureType == STRUCTURE_SPAWN ||
                                                structure.structureType == STRUCTURE_LAB ||
                                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                                        }
                                    });
                                }
                            } else {
                                if (getNewStructure) {
                                    targets = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                        filter: (structure) => {
                                            return (structure.structureType == STRUCTURE_EXTENSION ||
                                                structure.structureType == STRUCTURE_SPAWN ||
                                                structure.structureType == STRUCTURE_LAB) && structure.energy < structure.energyCapacity && structure.id != savedTarget.id;
                                        }
                                    });
                                } else {
                                    targets = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                        filter: (structure) => {
                                            return (structure.structureType == STRUCTURE_EXTENSION ||
                                                structure.structureType == STRUCTURE_SPAWN ||
                                                structure.structureType == STRUCTURE_LAB) && structure.energy < structure.energyCapacity;
                                        }
                                    });
                                }
                            }

                            if (targets) {
                                creep.memory.structureTarget = targets.id;
                                if (getNewStructure) {
                                    creep.travelTo(targets);
                                } else if (creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(targets);
                                } else {
                                    creep.memory.structureTarget = undefined;
                                }
                            } else {
                                //Store in terminal
                                var terminalTarget = Game.getObjectById(creep.memory.terminalID)
                                if (terminalTarget) {
                                    let targetEnergy = 0;
                                    if (creep.room.storage) {
                                        if (creep.room.storage.store[RESOURCE_ENERGY] >= 350000) {
                                            targetEnergy = 60000;
                                        } else if (creep.room.storage.store[RESOURCE_ENERGY] >= 50000) {
                                            targetEnergy = 30000;
                                        }
                                    }
                                    if (terminalTarget.store[RESOURCE_ENERGY] < targetEnergy && (terminalTarget.storeCapacity - 5000) > _.sum(terminalTarget.store)) {
                                        creep.memory.structureTarget = terminalTarget.id;
                                        if (creep.transfer(terminalTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(terminalTarget);
                                        }
                                    } else {
                                        terminalTarget = undefined;
                                    }
                                }

                                if (!terminalTarget) {
                                    //Level8 Structures
                                    var targets2;
                                    if (creep.room.controller.level == 8) {
                                        targets2 = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                                            filter: (structure) => {
                                                return (structure.structureType == STRUCTURE_POWER_SPAWN ||
                                                    structure.structureType == STRUCTURE_NUKER) && structure.energy < structure.energyCapacity;
                                            }
                                        });
                                    }
                                    if (targets2) {
                                        creep.memory.structureTarget = targets2.id;
                                        if (creep.transfer(targets2, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                            creep.travelTo(targets2);
                                        } else {
                                            creep.memory.structureTarget = undefined;
                                        }
                                    } else {
                                        //Build
                                        targets2 = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                                        if (targets2) {
                                            creep.memory.structureTarget = targets2.id;
                                            if (targets2.structureType == STRUCTURE_RAMPART) {
                                                creep.memory.lookForNewRampart = true;
                                            }

                                            if (creep.build(targets2) == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(targets2);
                                            } else if (creep.build(targets2) == ERR_NO_BODYPART) {
                                                creep.suicide();
                                            }
                                        } else {
                                            //Upgrade
                                            if (creep.room.controller.level == 8) {
                                                //Check for nearby link and fill it if possible.
                                                if (Memory.linkList[creep.room.name].length > 1) {
                                                    var upgraderLink = Game.getObjectById(Memory.linkList[creep.room.name][1]);
                                                    if (upgraderLink && upgraderLink.energy < 200) {
                                                        creep.memory.structureTarget = upgraderLink.id;
                                                        if (creep.transfer(upgraderLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                                            creep.travelTo(upgraderLink, {
                                                                maxRooms: 1
                                                            });
                                                        }
                                                    } else {
                                                        //Turn into a repair worker temporarily
                                                        creep.memory.priority = 'repair';
                                                        creep.memory.previousPriority = 'mule';
                                                    }
                                                }
                                            } else {
                                                creep.memory.structureTarget = creep.room.controller.id;
                                                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                                                    if (Game.flags[creep.room.name + "Controller"]) {
                                                        creep.travelTo(Game.flags[creep.room.name + "Controller"], {
                                                            maxRooms: 1
                                                        });
                                                    } else {
                                                        creep.travelTo(creep.room.controller, {
                                                            maxRooms: 1
                                                        });
                                                    }
                                                } else if (creep.upgradeController(creep.room.controller) == ERR_NO_BODYPART) {
                                                    creep.suicide();
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            case 'distributor':
            case 'distributorNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'distributorNearDeath') {
                    creep.memory.priority = 'distributorNearDeath';
                }

                if (_.sum(creep.carry) == 0) {
                    //Get from storage
                    //Check 4th link first just in case
                    var linkTarget = undefined;
                    if (creep.memory.linkSource) {
                        linkTarget = Game.getObjectById(creep.memory.linkSource)
                    }
                    if (linkTarget && linkTarget.energy >= 200) {
                        if (creep.withdraw(linkTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(linkTarget, {
                                ignoreRoads: true
                            });
                        }
                    } else {
                        var storageTarget = creep.room.storage;
                        if (storageTarget) {
                            if (creep.withdraw(storageTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(storageTarget, {
                                    ignoreRoads: true
                                });
                            }
                        }
                    }
                } else if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                    var savedTarget = Game.getObjectById(creep.memory.structureTarget);
                    var getNewStructure = false;
                    if (savedTarget && savedTarget.energy < savedTarget.energyCapacity) {
                        if (creep.transfer(savedTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(savedTarget);
                        } else {
                            getNewStructure = true;
                            creep.memory.structureTarget = undefined;
                        }
                    } else if (savedTarget) {
                        getNewStructure = true;
                        creep.memory.structureTarget = undefined;
                    }
                    if (!creep.memory.structureTarget) {
                        var target = undefined;
                        if (getNewStructure) {
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                filter: (structure) => {
                                    return (structure.structureType == STRUCTURE_EXTENSION ||
                                        structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity && structure.id != savedTarget.id;
                                }
                            });
                        } else {
                            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                filter: (structure) => {
                                    return (structure.structureType == STRUCTURE_EXTENSION ||
                                        structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                                }
                            });
                        }

                        if (target) {
                            if (getNewStructure) {
                                creep.travelTo(target);
                                creep.memory.structureTarget = target.id;
                            } else if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(target);
                                creep.memory.structureTarget = target.id;
                            }
                        }
                    }
                } else if (creep.room.controller.level != 8 && Memory.linkList[creep.room.name].length > 1) {
                    var upLink = Game.getObjectById(Memory.linkList[creep.room.name][1])
                    if (upLink) {
                        if (creep.transfer(upLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(upLink);
                        }
                    }
                } else if (_.sum(creep.carry) < creep.carryCapacity) {
                    //Get from storage
                    //Check 4th link first just in case
                    var linkTarget = undefined;
                    if (creep.memory.linkSource) {
                        linkTarget = Game.getObjectById(creep.memory.linkSource)
                    }
                    if (linkTarget && linkTarget.energy >= 200) {
                        if (creep.withdraw(linkTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(linkTarget);
                        }
                    } else {
                        var storageTarget = creep.room.storage;
                        if (storageTarget) {
                            if (creep.withdraw(storageTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.travelTo(storageTarget);
                            }
                        }
                    }
                } else {
                    var homeSpawn = Game.getObjectById(creep.memory.fromSpawn)
                    if (homeSpawn) {
                        if (!creep.pos.isNearTo(homeSpawn)) {
                            creep.travelTo(homeSpawn);
                        } else {
                            //Make sure you're not in the way
                            let talkingCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                                filter: (thisCreep) => (creep.id != thisCreep.id && thisCreep.saying)
                            })
                            if (talkingCreeps.length) {
                                let coords = talkingCreeps[0].saying.split(";");
                                if (coords.length == 2 && creep.pos.x == parseInt(coords[0]) && creep.pos.y == parseInt(coords[1])) {
                                    //Standing in the way of a creep
                                    let thisDirection = creep.pos.getDirectionTo(talkingCreeps[0].pos);
                                    creep.move(thisDirection);
                                    creep.say("\uD83D\uDCA6", true);
                                }
                            }
                        }
                    }
                }
                break;
            case 'mineralMiner':
                var thisMineral = Game.getObjectById(creep.memory.mineralID);
                if (!creep.memory.nextMine) {
                    creep.memory.nextMine = Game.time + 6;
                }

                if (thisMineral.mineralAmount == 0 && _.sum(creep.carry) == 0) {
                    //Nothing left to do
                    creep.suicide();
                } else {
                    //Creep will immediately harvest and store mined materials
                    var storageTarget = creep.room.terminal;
                    if (!creep.pos.isNearTo(thisMineral)) {
                        creep.travelTo(thisMineral);
                    } else if (storageTarget && Game.time >= creep.memory.nextMine) {
                        if (creep.harvest(thisMineral) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(thisMineral);
                        } else {
                            creep.memory.nextMine = Game.time + 6;
                        }

                    }
                    if (_.sum(creep.carry) > 0) {
                        if (creep.transfer(storageTarget, thisMineral.mineralType) == ERR_NOT_IN_RANGE) {
                            //This should never actually fire, if ideal.
                            creep.travelTo(storageTarget);
                        }
                    }
                }
                break;
            case 'labWorker':
            case 'labWorkerNearDeath':
                if (creep.ticksToLive <= creep.memory.deathWarn && creep.memory.priority != 'labWorkerNearDeath') {
                    creep.memory.priority = 'labWorkerNearDeath';
                }

                if (!creep.memory.nextResourceCheck) {
                    creep.memory.nextResourceCheck = Game.time + 50;
                }

                if (Game.time >= creep.memory.nextResourceCheck && Game.flags[creep.memory.primaryFlag] && creep.memory.lab4) {
                    creep.memory.nextResourceCheck = Game.time + 50;
                    if (creep.memory.resourceChecks < 15) {
                        var lab4 = Game.getObjectById(creep.memory.lab4);
                        var lab5 = Game.getObjectById(creep.memory.lab5);
                        if (creep.room.terminal.store[creep.memory.mineral6] >= 40000) {
                            //Immediately swap flags
                            creep.memory.resourceChecks = 15;
                            if (creep.memory.mineral5 == RESOURCE_CATALYST && creep.memory.mineral6 != RESOURCE_CATALYZED_GHODIUM_ACID) {
                                //If producing something with catalyst, make an order.
                                var foundOrder = _.findKey(Game.market.orders, {
                                    'roomName': creep.room.name,
                                    'resourceType': creep.memory.mineral6
                                });
                                if (foundOrder) {
                                    //Update quantity if less than 40000
                                    var thisOrder = Game.market.orders[foundOrder];
                                    if (thisOrder.remainingAmount < 40000) {
                                        var comparableOrders = Game.market.getAllOrders(order => order.resourceType == creep.memory.mineral6 && order.type == ORDER_SELL);
                                        if (comparableOrders.length > 0) {
                                            comparableOrders.sort(orderPriceCompareBuying);
                                            var targetPrice = comparableOrders[0].price;
                                            if (Memory.RoomsAt5.indexOf(comparableOrders[0].roomName) == -1) {
                                                //Not competing with self, undercut!
                                                targetPrice = targetPrice - 0.001
                                            }
                                            Game.market.changeOrderPrice(foundOrder, targetPrice);
                                            Game.market.extendOrder(foundOrder, creep.room.terminal.store[creep.memory.mineral6] - thisOrder.remainingAmount);
                                        } else {
                                            Game.market.extendOrder(foundOrder, creep.room.terminal.store[creep.memory.mineral6] - thisOrder.remainingAmount);
                                        }
                                    } else {
                                        //Keep prices up to date
                                        var comparableOrders = Game.market.getAllOrders(order => order.resourceType == creep.memory.mineral6 && order.type == ORDER_SELL);
                                        if (comparableOrders.length > 0) {
                                            comparableOrders.sort(orderPriceCompareBuying);
                                            var targetPrice = comparableOrders[0].price;
                                            if (Memory.RoomsAt5.indexOf(comparableOrders[0].roomName) == -1) {
                                                //Not competing with self, undercut!
                                                targetPrice = targetPrice - 0.001
                                            }
                                            Game.market.changeOrderPrice(foundOrder, targetPrice);
                                        }
                                    }
                                } else {
                                    //Create new order, 0.001 less than lowest comperable order
                                    var comparableOrders = Game.market.getAllOrders(order => order.resourceType == creep.memory.mineral6 && order.type == ORDER_SELL);
                                    if (comparableOrders.length > 0) {
                                        comparableOrders.sort(orderPriceCompareBuying);
                                        var targetPrice = comparableOrders[0].price;
                                        if (Memory.RoomsAt5.indexOf(comparableOrders[0].roomName) == -1) {
                                            //Not competing with self, undercut!
                                            targetPrice = targetPrice - 0.001
                                        }
                                        Game.market.createOrder(ORDER_SELL, creep.memory.mineral6, targetPrice, creep.room.terminal.store[creep.memory.mineral6], creep.room.name);
                                    }
                                }
                            }
                            //Game.notify('PRODUCTION MAXED: ' + creep.room.name + ' has swapped off ' + creep.memory.primaryFlag + ' New Target : ' + creep.memory.backupFlag);
                        } else if (lab4 && lab5 && (lab4.mineralAmount < creep.carryCapacity || lab5.mineralAmount < creep.carryCapacity) && _.sum(creep.carry) == 0) {
                            //tick up, but don't swap yet
                            creep.memory.resourceChecks = creep.memory.resourceChecks + 1;
                            if (creep.memory.resourceChecks >= 15) {
                                //Game.notify('NO MATERIALS:' + creep.room.name + ' has swapped off ' + creep.memory.primaryFlag + ' New Target : ' + creep.memory.backupFlag);
                            }
                        }
                    } else {
                        //Still can't find resources, switch flags
                        if (!Game.flags[creep.memory.backupFlag] && Game.flags[creep.memory.primaryFlag]) {
                            creep.room.createFlag(Game.flags[creep.memory.primaryFlag].pos, creep.memory.backupFlag, COLOR_CYAN);
                            Game.flags[creep.memory.primaryFlag].remove();
                        } else if (Game.flags[creep.memory.backupFlag] && Game.flags[creep.memory.primaryFlag]) {
                            //Just in case
                            Game.flags[creep.memory.primaryFlag].remove();
                        }
                    }
                } else if (Game.flags[creep.memory.backupFlag] && Game.flags[creep.memory.primaryFlag]) {
                    //Just in case
                    Game.flags[creep.memory.primaryFlag].remove();
                } else if (Game.flags[creep.memory.backupFlag] && creep.memory.resourceChecks >= 15 && _.sum(creep.carry) == 0) {
                    creep.suicide();
                }

                if (!creep.memory.offlineUntil || (creep.memory.offlineUntil && creep.memory.offlineUntil <= Game.time)) {
                    if (creep.memory.mineral1 == creep.memory.mineral6 || creep.memory.mineral2 == creep.memory.mineral6 || creep.memory.mineral3 == creep.memory.mineral6) {
                        creep.memory.storeProduced = true;
                    } else {
                        creep.memory.storeProduced = false;
                    }

                    var labArray = [];
                    var mineralArray = [];
                    var lab1 = Game.getObjectById(creep.memory.lab1);
                    var lab2 = Game.getObjectById(creep.memory.lab2);
                    var lab3 = Game.getObjectById(creep.memory.lab3);
                    var lab4 = undefined;
                    var lab5 = undefined;
                    var lab6 = undefined;
                    var lab7 = undefined;
                    var lab8 = undefined;
                    var lab9 = undefined;
                    if (creep.memory.lab4) {
                        lab4 = Game.getObjectById(creep.memory.lab4);
                        lab5 = Game.getObjectById(creep.memory.lab5);
                        lab6 = Game.getObjectById(creep.memory.lab6);
                    } else {
                        creep.memory.lab4 = 'XXX';
                        creep.memory.lab5 = 'XXX';
                        creep.memory.lab6 = 'XXX';
                    }

                    if (creep.memory.lab7) {
                        lab7 = Game.getObjectById(creep.memory.lab7);
                        lab8 = Game.getObjectById(creep.memory.lab8);
                        lab9 = Game.getObjectById(creep.memory.lab9);
                    } else {
                        creep.memory.lab7 = 'XXX';
                        creep.memory.lab8 = 'XXX';
                        creep.memory.lab9 = 'XXX';
                    }

                    var alreadyAddedFlag = false;
                    if (lab4 && lab5 && lab6) {
                        if (lab7 && lab8 && lab9) {
                            if (lab7.mineralAmount < lab4.mineralAmount || lab8.mineralAmount < lab5.mineralAmount) {
                                labArray.push(lab7);
                                labArray.push(lab8);
                                labArray.push(lab9);
                                mineralArray.push(creep.memory.mineral7);
                                mineralArray.push(creep.memory.mineral8);
                                mineralArray.push(creep.memory.mineral9);
                                labArray.push(lab4);
                                labArray.push(lab5);
                                labArray.push(lab6);
                                mineralArray.push(creep.memory.mineral4);
                                mineralArray.push(creep.memory.mineral5);
                                mineralArray.push(creep.memory.mineral6);
                                alreadyAddedFlag = true;
                            } else {
                                labArray.push(lab4);
                                labArray.push(lab5);
                                labArray.push(lab6);
                                mineralArray.push(creep.memory.mineral4);
                                mineralArray.push(creep.memory.mineral5);
                                mineralArray.push(creep.memory.mineral6);
                                labArray.push(lab7);
                                labArray.push(lab8);
                                labArray.push(lab9);
                                mineralArray.push(creep.memory.mineral7);
                                mineralArray.push(creep.memory.mineral8);
                                mineralArray.push(creep.memory.mineral9);
                                alreadyAddedFlag = true;
                            }
                        } else {
                            labArray.push(lab4);
                            labArray.push(lab5);
                            labArray.push(lab6);
                            mineralArray.push(creep.memory.mineral4);
                            mineralArray.push(creep.memory.mineral5);
                            mineralArray.push(creep.memory.mineral6);
                        }
                    }
                    if (lab1 && lab2 && lab3) {
                        labArray.push(lab1);
                        labArray.push(lab2);
                        labArray.push(lab3);
                        mineralArray.push(creep.memory.mineral1);
                        mineralArray.push(creep.memory.mineral2);
                        mineralArray.push(creep.memory.mineral3);
                    }
                    if (!alreadyAddedFlag && lab7 && lab8 && lab9) {
                        labArray.push(lab7);
                        labArray.push(lab8);
                        labArray.push(lab9);
                        mineralArray.push(creep.memory.mineral7);
                        mineralArray.push(creep.memory.mineral8);
                        mineralArray.push(creep.memory.mineral9);
                    }
                    var checkForMoreWork = false;
                    var foundWork = false;

                    var thisTarget = undefined;
                    if (creep.memory.structureTarget) {
                        thisTarget = Game.getObjectById(creep.memory.structureTarget);
                    }

                    if (thisTarget) {
                        if (creep.memory.direction == 'Withdraw' && creep.memory.priority != 'labWorkerNearDeath') {
                            foundWork = true;
                            var withdrawResult = creep.withdraw(thisTarget, creep.memory.mineralToMove);
                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                creep.travelTo(thisTarget, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            } else if (withdrawResult != ERR_NOT_IN_RANGE) {
                                creep.memory.structureTarget = undefined;
                                creep.memory.direction = undefined;
                                creep.memory.mineralToMove = undefined;
                            }
                        } else {
                            foundWork = true;
                            var transferResult = creep.transfer(thisTarget, creep.memory.mineralToMove)
                            if (transferResult == ERR_NOT_IN_RANGE) {
                                creep.travelTo(thisTarget, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            } else if (transferResult != ERR_NOT_IN_RANGE) {
                                creep.memory.structureTarget = undefined;
                                creep.memory.direction = undefined;
                                creep.memory.mineralToMove = undefined;
                            }
                        }
                    } else if (_.sum(creep.carry) == 0) {
                        for (var i in labArray) {
                            if (labArray[i].mineralAmount > 0 && labArray[i].mineralType != mineralArray[i]) {
                                foundWork = true;
                                creep.memory.movingOtherMineral = true;
                                var withdrawResult = creep.withdraw(labArray[i], labArray[i].mineralType)
                                if (withdrawResult == ERR_NOT_IN_RANGE) {
                                    creep.travelTo(labArray[i], {
                                        maxRooms: 1,
                                        ignoreRoads: true
                                    });
                                    creep.memory.structureTarget = labArray[i];
                                    creep.memory.direction = 'Withdraw';
                                    creep.memory.mineralToMove = labArray[i].mineralType;
                                }
                                break;
                            }
                        }
                    } else if (creep.memory.movingOtherMineral) {
                        //Drop off "unknown" mineral in terminal
                        foundWork = true;
                        var currentlyCarrying = _.findKey(creep.carry);
                        var transferResult = creep.transfer(creep.room.terminal, currentlyCarrying)
                        if (transferResult == ERR_NOT_IN_RANGE) {
                            creep.travelTo(creep.room.terminal, {
                                maxRooms: 1,
                                ignoreRoads: true
                            });
                            creep.memory.structureTarget = creep.room.terminal;
                            creep.memory.direction = 'Transfer';
                            creep.memory.mineralToMove = currentlyCarrying;
                        } else if (transferResult == OK) {
                            creep.memory.movingOtherMineral = false;
                            creep.memory.structureTarget = undefined;
                            creep.memory.direction = undefined;
                            creep.memory.mineralToMove = undefined;
                        }
                    } else if (!thisTarget) {
                        creep.memory.structureTarget = undefined;
                        creep.memory.direction = undefined;
                        creep.memory.mineralToMove = undefined;
                    }

                    if (!foundWork) {
                        for (var i in labArray) {
                            if (Game.flags[creep.room.name + "WarBoosts"]) {
                                switch (labArray[i].id) {
                                    case creep.memory.lab4:
                                    case creep.memory.lab5:
                                    case creep.memory.lab6:
                                    case creep.memory.lab1:
                                    case creep.memory.lab2:
                                    case creep.memory.lab3:
                                        //Boost labs
                                        if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                            var minAmount = mineralArray[i] in creep.room.terminal.store;
                                            var minLab = labArray[i].mineralAmount;
                                            if (minLab <= 2500 && minAmount > 0) {
                                                creep.memory.structureTarget = creep.room.terminal.id;
                                                creep.memory.direction = 'Withdraw';
                                                creep.memory.mineralToMove = mineralArray[i];
                                                var withdrawResult = creep.withdraw(creep.room.terminal, mineralArray[i]);
                                                if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                    creep.travelTo(creep.room.terminal, {
                                                        maxRooms: 1,
                                                        ignoreRoads: true
                                                    });
                                                }
                                                foundWork = true;
                                            }
                                        } else {
                                            var carryAmount = mineralArray[i] in creep.carry;
                                            if (carryAmount > 0) {
                                                creep.memory.structureTarget = labArray[i].id;
                                                creep.memory.direction = 'Transfer';
                                                creep.memory.mineralToMove = mineralArray[i];
                                                var transferResult = creep.transfer(labArray[i], mineralArray[i]);
                                                if (transferResult == ERR_NOT_IN_RANGE) {
                                                    creep.travelTo(labArray[i], {
                                                        maxRooms: 1,
                                                        ignoreRoads: true
                                                    });
                                                }
                                                foundWork = true;
                                            }
                                        }
                                        break;
                                }
                            } else {
                                //Write a different switch for the war flag
                                switch (labArray[i].id) {
                                    case creep.memory.lab4:
                                    case creep.memory.lab5:
                                    case creep.memory.lab7:
                                    case creep.memory.lab8:
                                        //Reagent labs
                                        if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                            if (creep.room.terminal.store[creep.memory.mineral6] < 40000 || !creep.room.terminal.store[creep.memory.mineral6]) {
                                                var mineralAmount = mineralArray[i] in creep.room.terminal.store;
                                                if (mineralAmount > 0 && labArray[i].mineralAmount < labArray[i].mineralCapacity - creep.carryCapacity) {
                                                    creep.memory.structureTarget = creep.room.terminal.id;
                                                    creep.memory.direction = 'Withdraw';
                                                    creep.memory.mineralToMove = mineralArray[i];
                                                    var withdrawResult = creep.withdraw(creep.room.terminal, mineralArray[i])
                                                    if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                        creep.travelTo(creep.room.terminal, {
                                                            maxRooms: 1,
                                                            ignoreRoads: true
                                                        });
                                                    }
                                                    foundWork = true;
                                                }
                                            }
                                        } else if (creep.carry[mineralArray[i]] && labArray[i].mineralAmount < labArray[i].mineralCapacity - creep.carryCapacity) {
                                            creep.memory.structureTarget = labArray[i].id;
                                            creep.memory.direction = 'Transfer';
                                            creep.memory.mineralToMove = mineralArray[i];
                                            var transferResult = creep.transfer(labArray[i], mineralArray[i])
                                            if (transferResult == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(labArray[i], {
                                                    maxRooms: 1,
                                                    ignoreRoads: true
                                                });
                                            }
                                            foundWork = true;
                                        }
                                        break;
                                    case creep.memory.lab6:
                                    case creep.memory.lab9:
                                        if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                            var mineralAmount = labArray[i].mineralAmount;
                                            if (mineralAmount >= creep.carryCapacity) {
                                                creep.memory.structureTarget = labArray[i].id;
                                                creep.memory.direction = 'Withdraw';
                                                creep.memory.mineralToMove = mineralArray[i];
                                                var withdrawResult = creep.withdraw(labArray[i], labArray[i].mineralType)
                                                if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                    creep.travelTo(labArray[i], {
                                                        maxRooms: 1,
                                                        ignoreRoads: true
                                                    });
                                                }
                                                foundWork = true;
                                            }
                                        } else if (creep.carry[mineralArray[i]]) {
                                            if (creep.memory.storeProduced) {
                                                var labAmount = 9999;
                                                if (mineralArray[i] == creep.memory.mineral1) {
                                                    labAmount = lab1.mineralAmount;
                                                } else if (mineralArray[i] == creep.memory.mineral2) {
                                                    labAmount = lab2.mineralAmount;
                                                } else if (mineralArray[i] == creep.memory.mineral3) {
                                                    labAmount = lab3.mineralAmount;
                                                }
                                                if (labAmount <= 2500) {
                                                    continue;
                                                }
                                            }

                                            if (mineralArray[i] == RESOURCE_GHODIUM && creep.room.controller.level == 8 && Memory.nukerList[creep.room.name].length) {
                                                var thisNuker = Game.getObjectById(Memory.nukerList[creep.room.name][0]);
                                                if (thisNuker && thisNuker.ghodiumCapacity > thisNuker.ghodium) {
                                                    creep.memory.structureTarget = thisNuker.id;
                                                    creep.memory.direction = 'Transfer';
                                                    creep.memory.mineralToMove = RESOURCE_GHODIUM;
                                                    if (creep.transfer(thisNuker, mineralArray[i]) == ERR_NOT_IN_RANGE) {
                                                        creep.travelTo(thisNuker, {
                                                            maxRooms: 1,
                                                            ignoreRoads: true
                                                        });
                                                    }
                                                    foundWork = true;
                                                    continue;
                                                }
                                            }

                                            creep.memory.structureTarget = creep.room.terminal.id;
                                            creep.memory.direction = 'Transfer';
                                            creep.memory.mineralToMove = mineralArray[i];
                                            if (creep.transfer(creep.room.terminal, mineralArray[i]) == ERR_NOT_IN_RANGE) {
                                                creep.travelTo(creep.room.terminal, {
                                                    maxRooms: 1,
                                                    ignoreRoads: true
                                                });
                                            }
                                            foundWork = true;
                                        }
                                        //Result labs
                                        break;
                                    case creep.memory.lab1:
                                    case creep.memory.lab2:
                                    case creep.memory.lab3:
                                        //Boost labs
                                        if (_.sum(creep.carry) == 0 && creep.memory.priority != 'labWorkerNearDeath') {
                                            var minAmount = mineralArray[i] in creep.room.terminal.store;
                                            var minLab = labArray[i].mineralAmount;
                                            if (minLab <= 2500 && minAmount > 0) {
                                                creep.memory.structureTarget = creep.room.terminal.id;
                                                creep.memory.direction = 'Withdraw';
                                                creep.memory.mineralToMove = mineralArray[i];
                                                var withdrawResult = creep.withdraw(creep.room.terminal, mineralArray[i]);
                                                if (withdrawResult == ERR_NOT_IN_RANGE) {
                                                    creep.travelTo(creep.room.terminal, {
                                                        maxRooms: 1,
                                                        ignoreRoads: true
                                                    });
                                                }
                                                foundWork = true;
                                            }
                                        } else {
                                            var carryAmount = mineralArray[i] in creep.carry;
                                            if (carryAmount > 0) {
                                                creep.memory.structureTarget = labArray[i].id;
                                                creep.memory.direction = 'Transfer';
                                                creep.memory.mineralToMove = mineralArray[i];
                                                var transferResult = creep.transfer(labArray[i], mineralArray[i]);
                                                if (transferResult == ERR_NOT_IN_RANGE) {
                                                    creep.travelTo(labArray[i], {
                                                        maxRooms: 1,
                                                        ignoreRoads: true
                                                    });
                                                }
                                                foundWork = true;
                                            }
                                        }
                                        break;
                                }
                            }

                            if (foundWork) {
                                break;
                            }
                        }
                    }

                    if (!foundWork && creep.room.storage && _.sum(creep.room.storage.store) != (creep.room.storage.store[RESOURCE_ENERGY] + creep.room.storage.store[RESOURCE_POWER])) {
                        if (Object.keys(creep.room.storage.store).length > 1 && Object.keys(creep.room.storage.store)[1] != RESOURCE_ENERGY) {
                            var withdrawResult = "N/A"
                            for (var i = 0, len = Object.keys(creep.room.storage.store).length; i < len; i++) {
                                if (Object.keys(creep.room.storage.store)[i] == RESOURCE_POWER || Object.keys(creep.room.storage.store)[i] == RESOURCE_ENERGY) {
                                    continue;
                                } else {
                                    withdrawResult = creep.withdraw(creep.room.storage, Object.keys(creep.room.storage.store)[i]);
                                }
                            }
                            if (withdrawResult == ERR_NOT_IN_RANGE) {
                                creep.travelTo(creep.room.storage, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                            } else if (withdrawResult != ERR_NOT_IN_RANGE && withdrawResult != "N/A") {
                                creep.travelTo(creep.room.terminal, {
                                    maxRooms: 1,
                                    ignoreRoads: true
                                });
                                creep.memory.movingOtherMineral = true;
                            }
                        }
                    } else if (!foundWork && creep.room.controller.level == 8 && Memory.nukerList[creep.room.name].length) {
                        //creep.room.terminal.store[creep.memory.mineral3]
                        var thisNuker = Game.getObjectById(Memory.nukerList[creep.room.name][0])
                        if (thisNuker && thisNuker.ghodiumCapacity > thisNuker.ghodium && !creep.carry[RESOURCE_GHODIUM] && creep.room.terminal.store[RESOURCE_GHODIUM]) {
                            creep.memory.structureTarget = creep.room.terminal.id;
                            creep.memory.direction = 'Withdraw';
                            creep.memory.mineralToMove = RESOURCE_GHODIUM;
                        } else if (thisNuker && thisNuker.ghodiumCapacity > thisNuker.ghodium && creep.carry[RESOURCE_GHODIUM]) {
                            creep.memory.structureTarget = thisNuker.id;
                            creep.memory.direction = 'Transfer';
                            creep.memory.mineralToMove = RESOURCE_GHODIUM;
                        } else if (thisNuker && thisNuker.ghodiumCapacity == thisNuker.ghodium && creep.carry[RESOURCE_GHODIUM]) {
                            creep.memory.structureTarget = creep.room.terminal.id;
                            creep.memory.direction = 'Transfer';
                            creep.memory.mineralToMove = RESOURCE_GHODIUM;
                        } else {
                            creep.memory.offlineUntil = Game.time + 10;
                        }
                    } else if (!foundWork) {
                        creep.memory.offlineUntil = Game.time + 10;
                    }
                } else {
                    //Determine if this creep needs to move over
                    let talkingCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                        filter: (thisCreep) => (creep.id != thisCreep.id && thisCreep.saying)
                    })
                    if (talkingCreeps.length) {
                        let coords = talkingCreeps[0].saying.split(";");
                        if (coords.length == 2 && creep.pos.x == parseInt(coords[0]) && creep.pos.y == parseInt(coords[1])) {
                            //Standing in the way of a creep
                            let thisDirection = creep.pos.getDirectionTo(talkingCreeps[0].pos);
                            creep.move(thisDirection);
                            creep.say("\uD83D\uDCA6", true);
                        }
                    }
                }

                break;
        }

        if (Memory.roomsUnderAttack.indexOf(creep.room.name) > -1 && creep.memory.priority != 'repair' && creep.memory.priority != 'distributor' && creep.memory.priority != 'supplier') {
            var Foe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 7, {
                filter: (eCreep) => ((eCreep.getActiveBodyparts(ATTACK) > 0 || eCreep.getActiveBodyparts(RANGED_ATTACK) > 0) && !Memory.whiteList.includes(eCreep.owner.username))
            });

            if (Foe.length) {
                if (creep.memory.fromSpawn) {
                    var thisSpawn = Game.getObjectById(creep.memory.fromSpawn);
                    if (thisSpawn) {
                        creep.travelTo(spawnTarget);
                    }
                } else {
                    var spawnTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_SPAWN;
                        }
                    });
                    if (spawnTarget) {
                        creep.travelTo(spawnTarget);
                    }
                }
            }
        }

        /*if (creep.memory.homeRoom && creep.room.name != creep.memory.homeRoom) {
            creep.travelTo(new RoomPosition(25, 25, creep.memory.homeRoom))
        }*/
    }
};

module.exports = creep_work5;

function repairCompare(a, b) {
    if (a.hits < b.hits)
        return -1;
    if (a.hits > b.hits)
        return 1;
    return 0;
}

function orderPriceCompareBuying(a, b) {
    if (a.price < b.price)
        return -1;
    if (a.price > b.price)
        return 1;
    return 0;
}