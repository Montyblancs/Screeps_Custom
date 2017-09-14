var creep_powerHeal = {

	/** @param {Creep} creep **/
	run: function(creep) {
		if (!Game.flags[creep.memory.homeRoom + "PowerGather"]) {
			//You are not required
			creep.suicide();
		} else {
			//Flag active
			if (creep.room.name != creep.memory.destination) {
				//Travel to room
				if (Game.flags[creep.memory.homeRoom + "PowerGather"] && Game.flags[creep.memory.homeRoom + "PowerGather"]) {
					creep.travelTo(Game.flags[creep.memory.homeRoom + "PowerGather"]);
				} else {
					creep.travelTo(new RoomPosition(25, 25, creep.memory.destination));
				}
			} else {
				//Main loop
				if (!creep.memory.targetAttacker) {
					var attackers = Game.rooms[creep.room.name].find(FIND_MY_CREEPS, {
						filter: (creep) => (creep.getActiveBodyparts(ATTACK) >= 1)
					});
					if (attackers.length) {
						creep.memory.targetAttacker = attackers[0];
						creep.travelTo(attackers[0]);
					} else {
						creep.travelTo(Game.flags[creep.memory.homeRoom + "PowerGather"], {
							range: 5
						});
					}
				} else {
					var thisAttacker = Game.getObjectById(creep.memory.targetAttacker);
					if (thisAttacker) {
						if (creep.heal(thisAttacker) == ERR_NOT_IN_RANGE) {
							creep.travelTo(thisAttacker);
						}
					} else {
						//Cannot find attacker, clear memory
						creep.memory.targetAttacker = undefined;
						creep.travelTo(Game.flags[creep.memory.homeRoom + "PowerGather"], {
							range: 5
						});
					}
				}
			}
		}
	}

};

module.exports = creep_powerHeal;