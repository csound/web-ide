import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CachedProfileImage from "./cached-profile-image";
import CachedAvatar from "./cached-avatar";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it("loads remote profile photos without requiring canvas or CORS access", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const cache = vi.spyOn(Storage.prototype, "setItem");
    const onLoad = vi.fn();
    render(
        <CachedProfileImage
            src="https://photos.example/portrait.png"
            alt="Rory"
            onLoad={onLoad}
        />
    );
    const image = screen.getByAltText("Rory");
    expect(image.getAttribute("src")).toBe(
        "https://photos.example/portrait.png"
    );
    expect(image.hasAttribute("crossorigin")).toBe(false);
    fireEvent.load(image);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Loading...")).toBeNull();
    expect(canvas).not.toHaveBeenCalled();
    expect(cache).not.toHaveBeenCalled();
});

it("handles a missing photo quietly and tries a replacement source", () => {
    const warning = vi.spyOn(console, "warn");
    const onError = vi.fn();
    const { rerender } = render(
        <CachedProfileImage
            src="/missing.png"
            alt="Portrait"
            onError={onError}
        />
    );
    fireEvent.error(screen.getByAltText("Portrait"));
    expect(screen.queryByAltText("Portrait")).toBeNull();
    expect(screen.queryByText("Loading...")).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(warning).not.toHaveBeenCalled();
    rerender(<CachedProfileImage src="/replacement.png" alt="Portrait" />);
    expect(screen.getByAltText("Portrait").getAttribute("src")).toBe(
        "/replacement.png"
    );
    rerender(<CachedProfileImage alt="Portrait" />);
    expect(screen.queryByAltText("Portrait")).toBeNull();
});

it("does not restart a photo load when its callbacks change", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(
        <CachedProfileImage
            src="/portrait.png"
            alt="Portrait"
            onLoad={first}
            showLoadingPlaceholder={false}
        />
    );
    const image = screen.getByAltText("Portrait");
    rerender(
        <CachedProfileImage
            src="/portrait.png"
            alt="Portrait"
            onLoad={latest}
            showLoadingPlaceholder={false}
        />
    );
    expect(screen.getByAltText("Portrait")).toBe(image);
    fireEvent.load(image);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
});

it("lets avatars load remote images without a canvas cache", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    render(
        <CachedAvatar src="https://photos.example/avatar.png" alt="Avatar">
            RW
        </CachedAvatar>
    );
    const image = screen.getByAltText("Avatar");
    expect(image.getAttribute("src")).toBe("https://photos.example/avatar.png");
    expect(image.hasAttribute("crossorigin")).toBe(false);
    expect(canvas).not.toHaveBeenCalled();
});

it("uses CORS for images in the isolated editor", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    try {
        render(
            <>
                <CachedProfileImage src="/portrait.png" alt="Portrait" />
                <CachedAvatar src="/avatar.png" alt="Avatar" />
            </>
        );
        expect(
            screen.getByAltText("Portrait").getAttribute("crossorigin")
        ).toBe("anonymous");
        expect(screen.getByAltText("Avatar").getAttribute("crossorigin")).toBe(
            "anonymous"
        );
    } finally {
        vi.unstubAllGlobals();
    }
});

it.each([
    { isolated: true, callback: false },
    { isolated: true, callback: true },
    { isolated: false, callback: false },
    { isolated: false, callback: true }
])(
    "matches Avatar preload and visible image settings (isolated: $isolated, callback: $callback)",
    ({ isolated, callback }) => {
        vi.stubGlobal("crossOriginIsolated", isolated);
        const requests: {
            image: HTMLImageElement;
            crossOrigin: string | null;
            referrerPolicy: string;
        }[] = [];
        // Keep the real MUI Avatar and capture settings when its preload starts.
        vi.stubGlobal("Image", function ImageProbe() {
            const image = document.createElement("img");
            Object.defineProperty(image, "src", {
                get: () => image.getAttribute("src") || "",
                set: (src: string) => {
                    image.setAttribute("src", src);
                    requests.push({
                        image,
                        crossOrigin: image.crossOrigin,
                        referrerPolicy: image.referrerPolicy
                    });
                }
            });
            return image;
        });
        const imageProps = {
            referrerPolicy: "no-referrer"
        } satisfies React.ImgHTMLAttributes<HTMLImageElement>;
        render(
            <CachedAvatar
                src="https://photos.example/avatar.png"
                alt="Avatar"
                slotProps={{ img: callback ? () => imageProps : imageProps }}
            >
                RW
            </CachedAvatar>
        );
        expect(requests).toHaveLength(1);
        const request = requests[0];
        expect(request.crossOrigin).toBe(isolated ? "anonymous" : null);
        expect(request.referrerPolicy).toBe("no-referrer");
        const image = screen.getByAltText("Avatar");
        expect(image.getAttribute("crossorigin")).toBe(request.crossOrigin);
        expect(image.getAttribute("referrerpolicy")).toBe(
            request.referrerPolicy
        );
        fireEvent.load(request.image);
        expect(screen.getByAltText("Avatar")).toBe(image);
        expect(screen.queryByText("RW")).toBeNull();
        fireEvent.error(request.image);
        expect(screen.queryByAltText("Avatar")).toBeNull();
        expect(screen.getByText("RW")).toBeDefined();
    }
);
