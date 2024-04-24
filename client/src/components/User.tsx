import { Link } from "@tanstack/react-router";

export default function User({
  picture,
  username,
}: {
  picture: string;
  username: string;
}) {
  return (
    <Link to={"/profile/" + username} className="flex items-center gap-3 w-fit">
      <img className="h-10 w-10 rounded-full" src={picture} />
      <span>{username}</span>
    </Link>
  );
}

