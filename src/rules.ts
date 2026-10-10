// gets ability modifier for given stat score
export function abilityModifier(score: number): number {
    if (score > 30 || score < 1) {
        throw new RangeError("Score must be an integer from 1 to 30");
    }
    return(Math.ceil(((score-10)/2)));
}

// gets proficiency bonus based off player level
export function proficiencyBonus(level: number): number {
    if (level < 1 || level > 20) {
        throw new RangeError ("Level between 1 to 20")
    }
    return (level/4 + 1);
}

// formats 
export function formatModifier(mod: number): string {
    if (mod >= 0) {
        return "+"+ mod.toString();
    }
    return mod.toString();
}