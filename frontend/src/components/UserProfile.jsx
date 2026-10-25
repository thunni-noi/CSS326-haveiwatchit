import { User as GuestIcon } from "lucide-react"
import { useState } from "react"


function UserProfile( {user, className} ){
    const[imgFailed, setImgFailed] = useState(false);   

    if (user?.avatar_url && !imgFailed){
        return( 
        <div className={`${className}`}>
            <img 
                src={user.avatar_url}
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"/>
        </div>
        )
    }
    else if (typeof user?.username === "string") {
        return (
            <div className={`${className}`}>
                <span className="text-lg font-semibold">
                    {user.username.trim().charAt(0)}
                </span>
            </div>
        )
    }
    else {
        return (
            <GuestIcon className={className}/>
        )
    }
    
}

export default UserProfile;