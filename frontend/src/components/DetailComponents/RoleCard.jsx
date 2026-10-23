import PlaceholderImg from "../../assets/placeholder_image.jpg"

function RoleCard( {role} ){
    const hasCharacter = Boolean(role.character_name);

    // card for actor
    if (hasCharacter){
        return (
            <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-800/60 p-2">
                <div className="flex items-center gap-3 min-w-0">
                    <img src= {role.character_image ?? PlaceholderImg} alt = {role.character_name}
                    className="object-cover w-12 aspect-2/3 rounded-sm shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{role.character_name}</p>
                        <p className="text-xs text-neutral-500">{role.role}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 min-w-0 text-right">
                    <p className="text-sm text-neutral-300 truncate">{role.person_name}</p>
                    <img src= {role.person_image ?? PlaceholderImg} alt = {role.person_name}
                    className="object-cover w-12 aspect-2/3 rounded-sm shrink-0" />
                </div>
            </div>

        )
    } else {
        return (
            <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-800/60 p-2">
                <div className="flex items-center gap-3 min-w-0">
                    <img src= {role.person_image ?? PlaceholderImg} alt = {role.person_name}
                    className="object-cover w-12 aspect-2/3 rounded-sm shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{role.person_name}</p>
                        <p className="text-xs text-neutral-500">{role.role}</p>
                    </div>
                </div>
            </div>

        )
    }
}

export default RoleCard;