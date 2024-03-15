export default function User({
  picture,
  username,
}: {
  picture: string;
  username: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <img className="h-10 w-10 rounded-full" src={picture} />
      <span>{username}</span>
    </div>
  );
}
