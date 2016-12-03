var spawn_BuildCreeps5 = {
	run: function(spawn, thisRoom) {
		var RoomCreeps = thisRoom.find(FIND_MY_CREEPS);

		var miners = _.filter(RoomCreeps, (creep) => creep.memory.priority == 'miner'); //Only gathers, does not move after reaching source
		var upgradeMiners = _.filter(RoomCreeps, (creep) => creep.memory.jobSpecific == 'upgradeMiner');
		var storageMiners = _.filter(RoomCreeps, (creep) => creep.memory.jobSpecific == 'storageMiner');

		var mules = _.filter(RoomCreeps, (creep) => creep.memory.priority == 'mule'); //Stores in spawn/towers, builds, upgrades
		var upgraders = _.filter(RoomCreeps, (creep) => creep.memory.priority == 'upgrader'); //Kinda important, and stuff.
		var mineralMiners = _.filter(RoomCreeps, (creep) => creep.memory.priority == 'mineralMiner');

		var minerMax = 2;
		var muleMax = 1;
		var upgraderMax = 2;
		var strSources = [];
		var strLinks = [];
		var strStorage = [];
		var strMineral = [];
		var strTerminal = [];
		var strExtractor = [];

		switch (thisRoom.name) {
			case 'E3N61':
				//two sources
				minerMax = 2;
				strSources.push('57ef9db786f108ae6e60e2a5', '57ef9db786f108ae6e60e2a7');
				strLinks.push('583adab41b9ba6bd6923fc74', '583af8fa827c44087d11fca1');
				muleMax = 2;
				strStorage.push('58388a3dac3bed8a51188517');
				UpgraderMax = 2;
				strMineral.push('57efa010195b160f02c752c6');
				strTerminal.push('58424a6ef6e01c883e9feb4b');
				strExtractor.push('58412458eebbe1bc1d83c710');
				break;
		}

		var roomMineral = Game.getObjectById(strMineral[0]);

		if (storageMiners.length == 0 && upgradeMiners.length > 0) {
			//reassign upgrade miner
			upgradeMiners[0].drop(RESOURCE_ENERGY);
			upgradeMiners[0].memory.jobSpecific = 'storageMiner';
			upgradeMiners[0].memory.linkSource = strStorage[0];
			upgradeMiners[0].memory.mineSource = strSources[0];
			upgradeMiners = _.filter(RoomCreeps, (creep) => creep.memory.jobSpecific == 'upgradeMiner');
			storageMiners = _.filter(RoomCreeps, (creep) => creep.memory.jobSpecific == 'storageMiner');
		}

		//900 Points
		var minerConfig = [CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE];
		//950 Points
		var muleConfig = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE];
		//Upgrader to use minerConfig
		//2,200 Points
		var mineralMinerConfig = [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY]

		var bareMinConfig = [WORK, CARRY, MOVE];

		if (RoomCreeps.length == 0 && spawn.canCreateCreep(bareMinConfig) == OK) {
			//In case of complete destruction, make a minimum viable worker
			//Make sure 5+ work code has harvester backup path
			spawn.createCreep(bareMinConfig, undefined, {
				priority: 'harvester'
			});
		} else if (Memory.roomsUnderAttack.indexOf(thisRoom.name) != -1) {
			if (thisRoom.energyAvailable >= 400) {
				//Try to produce millitary units

				//Melee unit set: TOUGH, TOUGH, MOVE, MOVE, MOVE, ATTACK - 250
				//Ranged unit set: MOVE, MOVE, RANGED_ATTACK - 250

				//Damaged modules do not work, put padding first.

				var meleeUnits = _.filter(RoomCreeps, (creep) => creep.memory.priority == 'melee');
				var rangedUnits = _.filter(RoomCreeps, (creep) => creep.memory.priority == 'ranged');

				var ChosenPriority = '';
				if (meleeUnits <= rangedUnits) {
					ChosenPriority = 'melee';
				} else {
					ChosenPriority = 'ranged';
				}

				var ToughCount = 0;
				var MoveCount = 0;
				var AttackCount = 0;
				var RangedCount = 0;
				var totalParts = 0;

				var remainingEnergy = thisRoom.energyAvailable;
				while ((remainingEnergy / 400) >= 1) {
					switch (ChosenPriority) {
						case 'melee':
							ToughCount = ToughCount + 1;
							MoveCount = MoveCount + 2;
							AttackCount = AttackCount + 3;
							totalParts = totalParts + 6;
							remainingEnergy = remainingEnergy - 350;
							break;
						case 'ranged':
							MoveCount = MoveCount + 2;
							RangedCount = RangedCount + 2;
							totalParts = totalParts + 4;
							remainingEnergy = remainingEnergy - 400;
							break;
					}

					if (totalParts >= 50) {
						break;
					}
				}

				var ChosenCreepSet = [];
				while (ToughCount > 0) {
					ChosenCreepSet.push(TOUGH);
					ToughCount--;
				}
				while (MoveCount > 1) {
					ChosenCreepSet.push(MOVE);
					MoveCount--;
				}
				while (AttackCount > 0) {
					ChosenCreepSet.push(ATTACK);
					AttackCount--;
				}
				while (RangedCount > 0) {
					ChosenCreepSet.push(RANGED_ATTACK);
					RangedCount--;
				}

				//Insert one move module last so the creep can still run
				ChosenCreepSet.push(MOVE);

				if (ChosenCreepSet.length > 50) {
					while (ChosenCreepSet.length > 50) {
						ChosenCreepSet.splice(0, 1)
					}
				}

				spawn.createCreep(ChosenCreepSet, undefined, {
					priority: ChosenPriority
				});
			}

		} else if (((miners.length < minerMax || mules.length < muleMax || upgraders.length < upgraderMax) && spawn.canCreateCreep(muleConfig) == OK) || (roomMineral.mineralAmount > 0 && mineralMiners.length == 0 && spawn.canCreateCreep(mineralMinerConfig) == OK)) {
			var prioritizedRole = 'miner';
			var creepSource = '';
			var connectedLink = '';
			var storageID = '';
			var jobSpecificPri = '';
			if (miners.length < minerMax) {
				prioritizedRole = 'miner';
				switch (storageMiners.length) {
					case 0:
						creepSource = strSources[0];
						connectedLink = strStorage[0];
						jobSpecificPri = 'storageMiner';
						break;
					case 1:
						creepSource = strSources[1];
						connectedLink = strLinks[0];
						jobSpecificPri = 'upgradeMiner';
						break;
				}
			} else if (mules.length < muleMax) {
				prioritizedRole = 'mule';
				storageID = strStorage[0];
				connectedLink = strLinks[1];
				creepSource = strTerminal[0];
			} else if (upgraders.length < upgraderMax) {
				prioritizedRole = 'upgrader';
				storageID = strStorage[0];
				connectedLink = strLinks[1];
			} else if (roomMineral.mineralAmount > 0 && mineralMiners.length == 0) {
				prioritizedRole = 'mineralMiner';
				storageID = strTerminal[0];
				creepSource = strMineral[0];
				connectedLink = strExtractor[0];
			}

			if (prioritizedRole == 'miner') {
				spawn.createCreep(minerConfig, undefined, {
					priority: prioritizedRole,
					mineSource: creepSource,
					linkSource: connectedLink,
					jobSpecific: jobSpecificPri,
					fromSpawn: spawn
				});
			} else if (prioritizedRole == 'mule') {
				spawn.createCreep(muleConfig, undefined, {
					priority: prioritizedRole,
					linkSource: connectedLink,
					storageSource: storageID,
					terminalID: creepSource,
					fromSpawn: spawn
				});
			} else if (prioritizedRole == 'upgrader') {
				spawn.createCreep(minerConfig, undefined, {
					priority: prioritizedRole,
					linkSource: connectedLink,
					storageSource: storageID,
					fromSpawn: spawn
				});
			} else {
				spawn.createCreep(mineralMinerConfig, undefined, {
					priority: prioritizedRole,
					terminalID: storageID,
					mineralID: creepSource,
					extractorID: connectedLink,
					fromSpawn: spawn
				});
			}

		}
	}
};

module.exports = spawn_BuildCreeps5;