LABEL_MAP = {
    "Gunmen": "Armed Individual",
    "Rifle": "Firearm",
    "pistol": "Firearm",
    "shot-gun": "Firearm",
    "submachine-gun": "Firearm",
    "knife": "Knife",
    "knife_attacker": "Armed Individual",
    "blunt object": "Blunt Weapon",
    "person": "Person"
}

THREAT_CLASSES = {
    "Firearm",
    "Knife",
    "Blunt Weapon",
    "Armed Individual"
}


def display_label(label):
    return LABEL_MAP.get(label, label)