const Operator = Object.freeze({
    ADDITION: "ADDITION",
    SUBTRACTION: "SUBTRACTION",
    MULTIPLICATION: "MULTIPLICATION",
    DIVISION: "DIVISION"
});

const Format = Object.freeze({
    STACKED: "STACKED",
    INLINE: "INLINE", //E.g., "2 x 3 = _"
    BRACKET: "BRACKET", //Division-only, long-division style, e.g., "3 ) 6" with the quotient on top
    FRACTION: "FRACTION", //Division-only, a number above another with a line between, followed by equals, e.g., "6/3 = _"
    ALGEBRAIC: "ALGEBRAIC" //Division or subtraction, stacked, e.g., "6 = 3 x _" :: TODO, not fully thought-out yet
    //"6 = 4 + _" would also work for subtraction (for "6 - 4" problem)
});

const hardcodedPresets = [
    //ADDITION
    //These sets were constructed with a focus on conceptual understanding and strategies while keeping to four sets of similar sizes
    { name: "Set A", operator: Operator.ADDITION, description: "Add 0 (identity); add 1 (count on); add 2 (count on two)", facts: [
        [0,0], [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [11,0],
        [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,11],
        [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [12,1],
        [1,3], [1,4], [1,5], [1,6], [1,7], [1,8], [1,12],
        [4,2], [5,2], [6,2], [7,2], [9,2], [11,2], [12,2],
        [2,4], [2,5], [2,6], [2,7], [2,9], [2,11], [2,12]]
    },
    { name: "Set B", operator: Operator.ADDITION, description: "Doubles and add ten", facts: [
        //Doubles (excluding 0)
        [1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,10], [11,11], [12,12],
        //Tens (excluding 10+11 and 10+12)
        [0,10], [1,10], [2,10], [3,10], [4,10], [5,10], [6,10], [7,10], [8,10],
        [10,0], [10,1], [10,2], [10,3], [10,4], [10,5], [10,6], [10,7], [10,8]]
    },
    { name: "Set C", operator: Operator.ADDITION, description: "Near-doubles", facts: [
        [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [7,8], [8,9], [9,10], [10,11], [11,12],
        [2,1], [3,2], [4,3], [5,4], [6,5], [7,6], [8,7], [9,8], [10,9], [11,10], [12,11]]
    },
    { name: "Set D", operator: Operator.ADDITION, description: "Make ten or twelve", facts: [
        [10,0], [9,1], [8,2], [7,3], [6,4], [5,5], [4,6], [3,7], [2,8], [1,9], [0,10],
        [12,0], [11,1], [10,2], [9,3], [8,4], [7,5], [6,6], [5,7], [4,8], [3,9], [2,10], [1,11], [0,12]]
    },
    { name: "Set E", operator: Operator.ADDITION, description: "Everything else", facts: [
        [3,5], [3,6], [3,8], [3,11], [3,12], [4,7], [4,9], [4,11], [4,12], [5,8], [5,9], [5,11], [5,12],
        [6,8], [6,9], [6,11], [6,12], [7,9], [7,11], [7,12], [8,11], [8,12], [9,11], [9,12], [10,12],
        [5,3], [6,3], [8,3], [11,3], [12,3], [7,4], [9,4], [11,4], [12,4], [8,5], [9,5], [11,5], [12,5],
        [8,6], [9,6], [11,6], [12,6], [9,7], [11,7], [12,7], [11,8], [12,8], [11,9], [12,9], [12,10]]
    },
    
    //SUBTRACTION
    //Mirrors the addition sets above. Format [minuend, subtrahend] (e.g., 6 - 4 = 2 is [6,4])
    { name: "Set A", operator: Operator.SUBTRACTION, description: "Subtract 0, 1 or 2; difference 0, 1, or 2", facts: [
        [0,0], [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [11,0],
        [1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [11,11],
        [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [13,1],
        [4,3], [5,4], [6,5], [7,6], [8,7], [9,8], [13,12],
        [6,2], [7,2], [8,2], [9,2], [11,2], [13,2], [14,2],
        [6,4], [7,5], [8,6], [9,7], [11,9], [13,11], [14,12]]
    },
    { name: "Set B", operator: Operator.SUBTRACTION, description: "Subtract half; subtract 10; difference 10", facts: [
        [2,1], [4,2], [6,3], [8,4], [10,5], [12,6], [14,7], [16,8], [18,9], [20,10], [22,11], [24,12],
        [10,10], [11,10], [12,10], [13,10], [14,10], [15,10], [16,10], [17,10], [18,10],
        [10,0], [11,1], [12,2], [13,3], [14,4], [15,5], [16,6], [17,7], [18,8]]
    },
    { name: "Set C", operator: Operator.SUBTRACTION, description: "Subtract near-half", facts: [
        [3,2], [5,3], [7,4], [9,5], [11,6], [13,7], [15,8], [17,9], [19,10], [21,11], [23,12],
        [3,1], [5,2], [7,3], [9,4], [11,5], [13,6], [15,7], [17,8], [19,9], [21,10], [23,11]]
    },
    { name: "Set D", operator: Operator.SUBTRACTION, description: "Ten-minus, twelve-minus", facts: [
        [10,0], [10,1], [10,2], [10,3], [10,4], [10,5], [10,6], [10,7], [10,8], [10,9], [10,10],
        [12,0], [12,1], [12,2], [12,3], [12,4], [12,5], [12,6], [12,7], [12,8], [12,9], [12,10], [12,11], [12,12]]
    },
    { name: "Set E", operator: Operator.SUBTRACTION, description: "Everything else", facts: [
        [8,5], [9,6], [11,8], [14,11], [15,12], [11,7], [13,9], [15,11], [16,12], [13,8], [14,9], [16,11], [17,12], 
        [14,8], [15,9], [17,11], [18,12], [16,9], [18,11], [19,12], [19,11], [20,12], [20,11], [21,12], [22,12],
        [8,3], [9,3], [11,3], [14,3], [15,3], [11,4], [13,4], [15,4], [16,4], [13,5], [14,5], [16,5], [17,5], 
        [14,6], [15,6], [17,6], [18,6], [16,7], [18,7], [19,7], [19,8], [20,8], [20,9], [21,9], [22,10]]
    },

    //MULTIPLICATION
    //From "Simply Good and Beautiful Math 3" curriculum. Set E is "everything else"
    { name: "Set A", operator: Operator.MULTIPLICATION, description: "Set A", facts: [ 
        [3,3], [6,6], [5,3], [8,4], [8,8], [3,4], [5,5], [9,9], [6,4], [3,5], [4,8], [4,3], [4,6]]
    },
    { name: "Set B", operator: Operator.MULTIPLICATION, description: "Set B", facts: [
        [4,4], [4,5], [7,3], [7,4], [8,5], [8,7], [9,3], [9,4], [9,5], [5,4], [3,7], [4,7], [5,8], [7,8], [3,9], [4,9], [5,9]]
    },
    { name: "Set C", operator: Operator.MULTIPLICATION, description: "Set C", facts: [
        [5,6], [5,7], [6,3], [6,8], [7,6], [7,7], [7,9], [8,3], [9,6], [9,8], [6,5], [7,5], [3,6], [8,6], [6,7], [9,7], [3,8], [6,9], [8,9]]
    },
    { name: "Set D", operator: Operator.MULTIPLICATION, description: "Set D", facts: [
        [12,3], [12,4], [12,5], [12,6], [12,7], [12,8], [12,9], [12,11], [12,12], [3,12], [4,12], [5,12], [6,12], [7,12], [8,12], [9,12], [11,12]]
    },
    { name: "Set E", operator: Operator.MULTIPLICATION, description: "Everything else", facts: [
        [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8], [1,9], [1,10], [1,11], [1,12], 
        [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], 
        [2,2], [2,3], [2,4], [2,5], [2,6], [2,7], [2,8], [2,9], [2,10], [2,11], [2,12], 
        [3,2], [4,2], [5,2], [6,2], [7,2], [8,2], [9,2], [10,2], [11,2], [12,2], 
        [3,10], [4,10], [5,10], [6,10], [7,10], [8,10], [9,10], [10,10], [11,10], [12,10], 
        [10,3], [10,4], [10,5], [10,6], [10,7], [10,8], [10,9], [10,11], [10,12], 
        [11,3], [11,4], [11,5], [11,6], [11,7], [11,8], [11,9], [11,11], 
        [3,11], [4,11], [5,11], [6,11], [7,11], [8,11], [9,11], 
        [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,10], [0,11], [0,12], 
        [1,0], [2,0], [3,0], [4,0], [5,0], [6,0], [7,0], [8,0], [9,0], [10,0], [11,0], [12,0]]
    },

    //DIVISION
    //Transformed from the multiplication sets above. Format [dividend, divisor] (e.g., 6 / 3 = 2 is [6,3])
    { name: "Set A", operator: Operator.DIVISION, description: "Set A", facts: [ 
        [9,3], [36,6], [15,3], [32,4], [64,8], [12,4], [25,5], [81,9], [24,4], [15,5], [32,8], [12,3], [24,6]]
    },
    { name: "Set B", operator: Operator.DIVISION, description: "Set B", facts: [
        [16,4], [20,5], [21,3], [28,4], [40,5], [56,7], [27,3], [36,4], [45,5], [20,4], [21,7], [28,7], [40,8], [56,8], [27,9], [36,9], [45,9]]
    },
    { name: "Set C", operator: Operator.DIVISION, description: "Set C", facts: [
        [30,6], [35,7], [18,3], [48,8], [42,6], [49,7], [63,9], [24,3], [54,6], [72,8], [30,5], [35,5], [18,6], [48,6], [42,7], [63,7], [24,8], [54,9], [72,9]]
    },
    { name: "Set D", operator: Operator.DIVISION, description: "Set D", facts: [
        [36,3], [48,4], [60,5], [72,6], [84,7], [96,8], [108,9], [132,11], [144,12], [36,12], [48,12], [60,12], [72,12], [84,12], [96,12], [108,12], [132,12]]
    },
    { name: "Set E", operator: Operator.DIVISION, description: "Everything else", facts: [
        [1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,10], [11,11], [12,12], 
        [2,1], [3,1], [4,1], [5,1], [6,1], [7,1], [8,1], [9,1], [10,1], [11,1], [12,1], 
        [4,2], [6,3], [8,4], [10,5], [12,6], [14,7], [16,8], [18,9], [20,10], [22,11], [24,12], 
        [6,2], [8,2], [10,2], [12,2], [14,2], [16,2], [18,2], [20,2], [22,2], [24,2], 
        [30,10], [40,10], [50,10], [60,10], [70,10], [80,10], [90,10], [100,10], [110,10], [120,10], 
        [30,3], [40,4], [50,5], [60,6], [70,7], [80,8], [90,9], [110,11], [120,12], 
        [33,3], [44,4], [55,5], [66,6], [77,7], [88,8], [99,9], [121,11], 
        [33,11], [44,11], [55,11], [66,11], [77,11], [88,11], [99,11], 
        [0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7], [0,8], [0,9], [0,10], [0,11], [0,12], 
        [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0], [0,0]]
    }
];

const ultraModeSettings = {
    runnerChanceMultiplier:  1.3,
    stickyPickerChance:      0.5,
    extraMultishots:           2,
    
    /*  0.001 per frame works out to 84% chance of at least 1 event per minute, 
        or 54% chance of at least 2 events per minute,
        or 27% chance of at least 3 events per minute.
        
        chance is per-frame
        cooldown is seconds
        last is performance.now() measurement and will change during gameplay
    */

    teleport:   { minScore: 40, chance: 0.0010, cooldown: 5, last: 0 }, //chance is per-frame
    divebomb:   { minScore: 50, chance: 0.1000, boost: 23, bleed: 0.15 }, //chance is per-non-runner
    rotate:     { minScore: 60, chance: 0.2000                       }, //chance is per-non-runner
    factchange: { minScore: 80, chance: 0.0010, cooldown: 5, last: 0 }, //chance is per-frame

    increaseChancesMinScore: 100, increaseChanceFactor: 3, //Multiply chances above by this
};

const gameState = {
    score: 0,
    selectedOperator: Operator.MULTIPLICATION,
    selectedFormat: Format.STACKED,
    facts: [],
    fullscreen: false,
    paused: false,
    gameover: false,
    hitCeiling: 0,
    autoSolve: false,
    autoSolveInProgress: false,
    


    features: {
        teleport:   { unlocked: false, multiplier: 1 },
        divebomb:   { unlocked: false, multiplier: 1 },
        rotate:     { unlocked: false, multiplier: 1 },
        factchange: { unlocked: false, multiplier: 1 },
    }
}