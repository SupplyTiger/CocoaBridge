import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { dbApi } from "../lib/api.js";

const FavoriteButton = ({ entityType, entityId, isFavorited }) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => dbApi.toggleFavorite(entityType, entityId),
    onSuccess: ({ favorited }) => {
      toast.success(favorited ? "Added to favorites" : "Removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["awards"] });
    },
    onError: () => {
      toast.error("Failed to update favorite");
    },
  });

  const handleClick = (e) => {
    e.stopPropagation();
    mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="btn btn-ghost btn-xs text-warning"
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isPending ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <Star
          className="size-6"
          fill={isFavorited ? "currentColor" : "none"}
        />
      )}
    </button>
  );
};

export default FavoriteButton;
