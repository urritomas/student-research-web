import { FaCheckCircle, FaEdit, FaShieldAlt } from "react-icons/fa"
import { MdTimelapse } from "react-icons/md"
import { FaThumbsUp } from "react-icons/fa6"
import { IoChatboxEllipses } from "react-icons/io5"

export default function StatusIcon({ status }: { status : string }) {
    let color, icon
    switch (status) {
        case "Completed":
            icon = <FaCheckCircle />
            color = "bg-green-400"
            break;
        case "Proposal":
            icon = <FaEdit />
            color = "bg-gray-300"
            break;
        case "Final Defense":
            icon = <FaShieldAlt />
            color = "bg-red-300"
            break;
        case "In Progress":
            icon = <MdTimelapse />
            color = "bg-blue-300"
            break;
        case "Approved":
            icon = <FaThumbsUp />
            color = "bg-green-200"
            break;
        case "Pre-Defense":
            icon = <IoChatboxEllipses />
            color = "bg-yellow-300"
            break;
    }
    
    return (
        <div className={`${color} text-sm flex items-center justify-around w-fit gap-2 h-6 px-3 rounded-full`}>
            {icon}
            <p>{status}</p>
        </div>
    )
}

