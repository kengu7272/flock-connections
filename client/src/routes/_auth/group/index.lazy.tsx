import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/group/")({
  component: Group,
});

export const GroupSchema = z
  .object({
    name: z.string().min(1).max(24),
    description: z.string().min(1).max(500),
  })
  .required();
type GroupSchemaType = z.infer<typeof GroupSchema>;
function Group() {
  const navigate = useNavigate();

  const inputClass =
    "focus:outline-none bg-slate-600 text-white rounded-lg p-2";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupSchemaType>({
    resolver: zodResolver(GroupSchema),
  });
  const create = trpc.group.create.useMutation({
    onSuccess: () => {
      toast.success("Group Created");
      navigate({ to: "/flock" });
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });
  const onSubmit: SubmitHandler<GroupSchemaType> = (data) => {
    if (!data.name.trim() || !data.description.trim()) {
      toast.error("Name & Description Must Contain Content");
      return;
    }

    create.mutate({ description: data.description, name: data.name });
  };

  return (
    <div className="flex w-full justify-center px-2 py-24 lg:px-0">
      <main className="w-full rounded-lg bg-slate-800 h-fit px-8 py-4 lg:mx-96">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold">Group Creation</h1>
          <div className="flex flex-col gap-2">
            <label>Name</label>
            <input
              className={inputClass}
              placeholder="Name (Max 24)"
              {...register("name")}
            />
            {errors.name && (
              <span className="text-sm text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label>Name</label>
            <textarea
              className={inputClass + " min-h-32"}
              placeholder="Tell everyone a little about your group (Max 500)"
              {...register("description")}
            />
            {errors.description && (
              <span className="text-sm text-red-500">
                {errors.description.message}
              </span>
            )}
          </div>
          <input
            type="submit"
            value="Create Group"
            className="ml-auto block rounded-lg bg-sky-500 px-2 py-3 hover:bg-sky-600 active:bg-sky-700"
          />
        </form>
      </main>
    </div>
  );
}
