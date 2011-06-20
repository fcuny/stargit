#!/usr/bin/env

use Dancer;
use StarGit;

use Plack::Builder;

my $app = sub {
    my $env     = shift;
    my $request = Dancer::Request->new($env);
    Dancer->dance($request);
};

builder {
    enable "ConditionalGET";
    enable "ETag";
    $app;
};
