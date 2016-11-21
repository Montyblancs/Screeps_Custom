var spawn_BuildCreeps = {
	run: function(spawn, bestWorker, thisRoom) {
		for (var name in Memory.creeps) {
			if (!Game.creeps[name]) {
				delete Memory.creeps[name];
				console.log('Clearing non-existing creep memory:', name);
			}
		}

		if (Memory.roomsUnderAttack.indexOf(thisRoom.name) != -1) {
			//Try to produce millitary units

			//TODO : Calculate best millitary unit, maybe slightly less than max cap.
			//Consider using only what's currently available?
			//Possible to get data on invaders parts?

			/*
			var targets = creep.room.find(FIND_HOSTILE_CREEPS, {
    			filter: function(object) {
        			return object.getActiveBodyparts(ATTACK) == 0;
    			}		
			}); */

			//Determine if possible to overpower invader by body part, if not build best.
			//Copy invader's part count?
		}

		//TODO : Count creeps by room, not globally.
		var harvesters = _.filter(Game.creeps, (creep) => creep.memory.priority == 'harvester');
		var builders = _.filter(Game.creeps, (creep) => creep.memory.priority == 'builder');
		var upgraders = _.filter(Game.creeps, (creep) => creep.memory.priority == 'upgrader');

		var bareMinConfig = [WORK, CARRY, MOVE];

		if ((harvesters.length == 0 && builders.length == 0 && upgraders.length == 0) && spawn.canCreateCreep(bareMinConfig) == OK) {
			//In case of complete destruction, make a minimum viable worker
			spawn.createCreep(bareMinConfig, undefined, {
				priority: 'harvester'
			});
		}

		if ((harvesters.length < 2 || builders.length < 2 || upgraders.length < 2) && spawn.canCreateCreep(bestWorker) == OK) {
			var prioritizedRole = 'harvester';
			if (harvesters.length < 2) {
				prioritizedRole = 'harvester';
			} else if (upgraders.length < 2) {
				prioritizedRole = 'upgrader';
			} else if (builders.length < 2) {
				prioritizedRole = 'builder';
			}

			spawn.createCreep(bestWorker, undefined, {
				priority: prioritizedRole
			});
		}
	}
};

module.exports = spawn_BuildCreeps;